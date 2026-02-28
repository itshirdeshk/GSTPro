import { prisma } from '../../config';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export class SubscriptionService {
  async getSubscription(tenantId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new NotFoundError('No active subscription found');
    }

    // Get usage stats
    const [invoiceCount, customerCount, userCount] = await Promise.all([
      prisma.invoice.count({
        where: {
          tenantId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.customer.count({
        where: { tenantId, deletedAt: null },
      }),
      prisma.user.count({
        where: { tenantId, isActive: true },
      }),
    ]);

    return {
      ...subscription,
      usage: {
        invoicesUsed: invoiceCount,
        customersUsed: customerCount,
        usersUsed: userCount,
      },
    };
  }

  async checkSubscriptionActive(tenantId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new BadRequestError('No active subscription. Please subscribe to continue.');
    }

    if (new Date() > subscription.endDate) {
      // Mark as expired
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestError('Subscription expired. Please renew to continue.');
    }

    return subscription;
  }

  async checkInvoiceLimit(tenantId: string) {
    const subscription = await this.checkSubscriptionActive(tenantId);

    const invoiceCount = await prisma.invoice.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    if (invoiceCount >= subscription.maxInvoicesPerMonth) {
      throw new BadRequestError(
        `Invoice limit reached (${subscription.maxInvoicesPerMonth}/month). Please upgrade your plan.`
      );
    }

    return subscription;
  }

  async upgradePlan(tenantId: string, planType: 'BASIC' | 'PRO') {
    const planLimits = {
      BASIC: { maxInvoicesPerMonth: 500, maxCustomers: 1000, maxUsers: 5 },
      PRO: { maxInvoicesPerMonth: 99999, maxCustomers: 99999, maxUsers: 50 },
    };

    const limits = planLimits[planType];
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    // Deactivate current subscription
    await prisma.subscription.updateMany({
      where: { tenantId, status: 'ACTIVE' },
      data: { status: 'CANCELLED' },
    });

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        tenantId,
        plan: planType,
        status: 'ACTIVE',
        endDate,
        ...limits,
      },
    });

    return subscription;
  }
}

export const subscriptionService = new SubscriptionService();
