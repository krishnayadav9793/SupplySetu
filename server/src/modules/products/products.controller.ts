import { Response, NextFunction } from 'express';
import { PriceTier } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ProductsService } from './products.service';
import { prisma } from '../../config';

export class ProductsController {
  /**
   * Helper to resolve the effective price tier for the request
   */
  private static async resolvePriceTier(req: AuthenticatedRequest): Promise<PriceTier> {
    // If explicit tier provided by Admin or Salesman
    if (req.query.tier && Object.values(PriceTier).includes(req.query.tier as PriceTier)) {
      return req.query.tier as PriceTier;
    }

    // If salesman/admin specifies a retailerId
    if (req.query.retailerId) {
      const retailer = await prisma.retailer.findUnique({
        where: { id: req.query.retailerId as string },
        select: { priceTier: true },
      });
      if (retailer) return retailer.priceTier;
    }

    // If logged-in user is a retailer
    if (req.user?.id) {
      const retailer = await prisma.retailer.findUnique({
        where: { userId: req.user.id },
        select: { priceTier: true },
      });
      if (retailer) return retailer.priceTier;
    }

    return PriceTier.STANDARD;
  }

  static async listProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.q as string | undefined;
      const category = req.query.category as string | undefined;
      const brand = req.query.brand as string | undefined;
      const inStockOnly = req.query.inStock === 'true';
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const tier = await ProductsController.resolvePriceTier(req);

      const result = await ProductsService.getProducts({
        search,
        category,
        brand,
        inStockOnly,
        tier,
        page,
        limit,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProductById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const tier = await ProductsController.resolvePriceTier(req);

      const product = await ProductsService.getProductById(id, tier);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await ProductsService.getCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBrands(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const brands = await ProductsService.getBrands();
      res.status(200).json({
        success: true,
        data: brands,
      });
    } catch (error) {
      next(error);
    }
  }
}
