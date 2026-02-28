import { Prisma } from '@prisma/client';
import { prisma } from '../../config';
import { NotFoundError } from '../../utils/errors';
import { CreateCustomerInput, UpdateCustomerInput } from './customer.validators';
import { validateGSTIN, getStateCodeFromGSTIN } from '../../utils/gst';
import { BadRequestError } from '../../utils/errors';

export class CustomerService {
  async create(tenantId: string, input: CreateCustomerInput) {
    // Validate GSTIN if provided
    if (input.gstin && input.gstin.length > 0) {
      if (!validateGSTIN(input.gstin)) {
        throw new BadRequestError('Invalid GSTIN format');
      }
      // Auto-extract state code from GSTIN
      if (!input.stateCode) {
        input.stateCode = getStateCodeFromGSTIN(input.gstin);
      }
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: input.name,
        gstin: input.gstin || null,
        phone: input.phone || null,
        email: input.email || null,
        address: input.address || null,
        city: input.city || null,
        state: input.state || null,
        stateCode: input.stateCode || null,
        pincode: input.pincode || null,
        creditLimit: input.creditLimit || 0,
      },
    });

    return customer;
  }

  async findAll(
    tenantId: string,
    params: {
      page: number;
      limit: number;
      skip: number;
      search?: string;
      state?: string;
      isActive?: boolean;
    }
  ) {
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { gstin: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search } },
      ];
    }

    if (params.state) {
      where.state = params.state;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return { customers, total };
  }

  async findById(tenantId: string, id: string) {
    const customer = await prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }

  async update(tenantId: string, id: string, input: UpdateCustomerInput) {
    const existing = await prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Customer not found');
    }

    if (input.gstin && input.gstin.length > 0) {
      if (!validateGSTIN(input.gstin)) {
        throw new BadRequestError('Invalid GSTIN format');
      }
      if (!input.stateCode) {
        input.stateCode = getStateCodeFromGSTIN(input.gstin);
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.gstin !== undefined && { gstin: input.gstin || null }),
        ...(input.phone !== undefined && { phone: input.phone || null }),
        ...(input.email !== undefined && { email: input.email || null }),
        ...(input.address !== undefined && { address: input.address || null }),
        ...(input.city !== undefined && { city: input.city || null }),
        ...(input.state !== undefined && { state: input.state || null }),
        ...(input.stateCode !== undefined && { stateCode: input.stateCode || null }),
        ...(input.pincode !== undefined && { pincode: input.pincode || null }),
        ...(input.creditLimit !== undefined && { creditLimit: input.creditLimit }),
      },
    });

    return customer;
  }

  async delete(tenantId: string, id: string) {
    const existing = await prisma.customer.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Customer not found');
    }

    // Soft delete
    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Customer deleted successfully' };
  }
}

export const customerService = new CustomerService();
