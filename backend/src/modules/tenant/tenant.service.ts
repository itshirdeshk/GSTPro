import { prisma } from '../../config';
import { NotFoundError } from '../../utils/errors';
import { UpdateTenantInput } from './tenant.validators';

export class TenantService {
  async getTenant(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    return tenant;
  }

  async updateTenant(tenantId: string, input: UpdateTenantInput) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: input,
    });

    return updated;
  }
}

export const tenantService = new TenantService();
