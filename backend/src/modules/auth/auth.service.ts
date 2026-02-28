import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config';
import { generateToken } from '../../middleware/auth';
import { ConflictError, NotFoundError, UnauthorizedError, BadRequestError } from '../../utils/errors';
import { SignupInput, LoginInput } from './auth.validators';

const BCRYPT_ROUNDS = 12;

export class AuthService {
  /**
   * Signup: Creates tenant + user + free subscription in a single transaction
   */
  async signup(input: SignupInput) {
    const { email, password, name, businessName } = input;

    // Check if email exists (globally, since we use email+tenantId unique)
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create tenant + user + subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          businessName,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          phone: input.phone || null,
          role: 'ADMIN',
        },
      });

      // Create free subscription (1 year)
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: 'FREE',
          status: 'ACTIVE',
          endDate,
          maxInvoicesPerMonth: 50,
          maxCustomers: 100,
          maxUsers: 1,
        },
      });

      return { user, tenant };
    });

    // Generate JWT
    const token = generateToken({
      userId: result.user.id,
      tenantId: result.tenant.id,
      role: result.user.role,
    });

    return {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        businessName: result.tenant.businessName,
      },
    };
  }

  /**
   * Login: Validates credentials, returns JWT
   */
  async login(input: LoginInput) {
    const { email, password } = input;

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        businessName: user.tenant.businessName,
        gstin: user.tenant.gstin,
        isComposition: user.tenant.isComposition,
      },
    };
  }

  /**
   * Get current user profile with tenant info
   */
  async getMe(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const subscription = await prisma.subscription.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
      },
      tenant: {
        id: user.tenant.id,
        businessName: user.tenant.businessName,
        legalName: user.tenant.legalName,
        gstin: user.tenant.gstin,
        stateCode: user.tenant.stateCode,
        address: user.tenant.address,
        phone: user.tenant.phone,
        email: user.tenant.email,
        isComposition: user.tenant.isComposition,
        logoUrl: user.tenant.logoUrl,
        invoicePrefix: user.tenant.invoicePrefix,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            endDate: subscription.endDate,
            maxInvoicesPerMonth: subscription.maxInvoicesPerMonth,
            maxCustomers: subscription.maxCustomers,
            maxUsers: subscription.maxUsers,
          }
        : null,
    };
  }

  /**
   * Forgot password: Generate reset token
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If an account with this email exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    // TODO: Push email job to BullMQ queue
    // await emailQueue.add('send-reset-email', { email, resetToken });

    return { message: 'If an account with this email exists, a reset link has been sent' };
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    return { message: 'Password reset successful' };
  }
}

export const authService = new AuthService();
