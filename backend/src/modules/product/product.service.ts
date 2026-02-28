import { Prisma } from '@prisma/client';
import { prisma } from '../../config';
import { NotFoundError } from '../../utils/errors';
import { CreateProductInput, UpdateProductInput } from './product.validators';

export class ProductService {
  async create(tenantId: string, input: CreateProductInput) {
    const product = await prisma.product.create({
      data: {
        tenantId,
        name: input.name,
        type: input.type || 'GOODS',
        hsnCode: input.hsnCode || null,
        sacCode: input.sacCode || null,
        gstRate: input.gstRate,
        sellingPrice: input.sellingPrice,
        costPrice: input.costPrice || null,
        unit: input.unit || 'Nos',
        stock: input.stock || 0,
        lowStockThreshold: input.lowStockThreshold || 10,
        description: input.description || null,
      },
    });

    return product;
  }

  async findAll(
    tenantId: string,
    params: {
      page: number;
      limit: number;
      skip: number;
      search?: string;
    }
  ) {
    const where: Prisma.ProductWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { hsnCode: { contains: params.search, mode: 'insensitive' } },
        { sacCode: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: params.skip,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  async findById(tenantId: string, id: string) {
    const product = await prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    return product;
  }

  async update(tenantId: string, id: string, input: UpdateProductInput) {
    const existing = await prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.hsnCode !== undefined && { hsnCode: input.hsnCode || null }),
        ...(input.sacCode !== undefined && { sacCode: input.sacCode || null }),
        ...(input.gstRate !== undefined && { gstRate: input.gstRate }),
        ...(input.sellingPrice !== undefined && { sellingPrice: input.sellingPrice }),
        ...(input.costPrice !== undefined && { costPrice: input.costPrice || null }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.unit !== undefined && { unit: input.unit }),
        ...(input.stock !== undefined && { stock: input.stock }),
        ...(input.lowStockThreshold !== undefined && { lowStockThreshold: input.lowStockThreshold }),
        ...(input.description !== undefined && { description: input.description || null }),
      },
    });

    return product;
  }

  async delete(tenantId: string, id: string) {
    const existing = await prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Product deleted successfully' };
  }

  async getStats(tenantId: string) {
    const [total, inStock, lowStock, outOfStock] = await Promise.all([
      prisma.product.count({ where: { tenantId, deletedAt: null } }),
      prisma.product.count({ where: { tenantId, deletedAt: null, stock: { gt: 10 } } }),
      prisma.product.count({
        where: {
          tenantId,
          deletedAt: null,
          stock: { gt: 0, lte: 10 },
        },
      }),
      prisma.product.count({ where: { tenantId, deletedAt: null, stock: { lte: 0 } } }),
    ]);

    return { total, inStock, lowStock, outOfStock };
  }

  async getLowStock(tenantId: string) {
    return prisma.product.findMany({
      where: {
        tenantId,
        deletedAt: null,
        stock: { lte: prisma.product.fields.lowStockThreshold as any },
      },
      orderBy: { stock: 'asc' },
      take: 10,
    });
  }
}

export const productService = new ProductService();
