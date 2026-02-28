import { Response, NextFunction } from 'express';
import { productService } from './product.service';
import { AuthRequest } from '../../types';
import { sendSuccess, sendCreated, sendPaginated, getPagination } from '../../utils/response';
import { getTenantId } from '../../middleware/tenantScope';

export class ProductController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const product = await productService.create(tenantId, req.body);
      sendCreated(res, product, 'Product created successfully');
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const { page, limit, skip } = getPagination(req.query as any);
      const search = req.query.search as string | undefined;

      const { products, total } = await productService.findAll(tenantId, {
        page, limit, skip, search,
      });

      sendPaginated(res, products, total, page, limit);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const product = await productService.findById(tenantId, req.params.id as string);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const product = await productService.update(tenantId, req.params.id as string, req.body);
      sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const result = await productService.delete(tenantId, req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = getTenantId(req);
      const stats = await productService.getStats(tenantId);
      sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
