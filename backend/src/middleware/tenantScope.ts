import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { UnauthorizedError } from '../utils/errors';

/**
 * Middleware that ensures tenantId is present in the request.
 * Must be used AFTER authenticate middleware.
 * Attaches tenantId to req for convenience.
 */
export function requireTenant(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (!req.user?.tenantId) {
    next(new UnauthorizedError('Tenant context required'));
    return;
  }
  next();
}

/**
 * Helper to extract tenantId from an authenticated request.
 * Throws if not available.
 */
export function getTenantId(req: AuthRequest): string {
  if (!req.user?.tenantId) {
    throw new UnauthorizedError('Tenant context required');
  }
  return req.user.tenantId;
}

/**
 * Helper to extract userId from an authenticated request.
 */
export function getUserId(req: AuthRequest): string {
  if (!req.user?.userId) {
    throw new UnauthorizedError('Auth context required');
  }
  return req.user.userId;
}
