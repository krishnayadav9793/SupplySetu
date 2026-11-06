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

  static async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        skuCode,
        name,
        brand,
        category,
        unit,
        packSize,
        mrp,
        basePrice,
        gstRate,
        stockQuantity,
        minOrderQty,
      } = req.body;

      const product = await ProductsService.createProduct({
        skuCode,
        name,
        brand,
        category,
        unit,
        packSize,
        mrp: parseFloat(mrp),
        basePrice: parseFloat(basePrice),
        gstRate: gstRate ? parseFloat(gstRate) : 18.0,
        stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 0,
        minOrderQty: minOrderQty ? parseInt(minOrderQty, 10) : 1,
      });

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const {
        name,
        brand,
        category,
        unit,
        packSize,
        mrp,
        basePrice,
        gstRate,
        isAvailable,
        stockQuantity,
        minOrderQty,
      } = req.body;

      const product = await ProductsService.updateProduct(id, {
        name,
        brand,
        category,
        unit,
        packSize,
        mrp: mrp !== undefined ? parseFloat(mrp) : undefined,
        basePrice: basePrice !== undefined ? parseFloat(basePrice) : undefined,
        gstRate: gstRate !== undefined ? parseFloat(gstRate) : undefined,
        isAvailable,
        stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity, 10) : undefined,
        minOrderQty: minOrderQty !== undefined ? parseInt(minOrderQty, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStock(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { stockQuantity, minOrderQty } = req.body;

      if (stockQuantity === undefined) {
        res.status(400).json({ success: false, message: 'stockQuantity is required' });
        return;
      }

      const result = await ProductsService.updateStock(
        id,
        parseInt(stockQuantity, 10),
        minOrderQty !== undefined ? parseInt(minOrderQty, 10) : undefined
      );

      res.status(200).json({
        success: true,
        message: 'Stock updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await ProductsService.deleteProduct(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listSchemes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const schemes = await ProductsService.listSchemes();
      res.status(200).json({
        success: true,
        data: schemes,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createScheme(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        name,
        schemeType,
        productId,
        minQuantity,
        freeQuantity,
        discountPercent,
        startDate,
        endDate,
        freeProductId,
      } = req.body;

      const scheme = await ProductsService.createScheme({
        name,
        schemeType,
        productId,
        minQuantity: parseInt(minQuantity, 10),
        freeQuantity: freeQuantity ? parseInt(freeQuantity, 10) : 0,
        discountPercent: discountPercent ? parseFloat(discountPercent) : 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
        freeProductId,
      });

      res.status(201).json({
        success: true,
        message: 'Trade scheme created successfully',
        data: scheme,
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleSchemeStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body;

      const scheme = await ProductsService.toggleSchemeStatus(id, isActive);

      res.status(200).json({
        success: true,
        message: `Scheme ${scheme.isActive ? 'activated' : 'paused'} successfully`,
        data: scheme,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteScheme(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await ProductsService.deleteScheme(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
