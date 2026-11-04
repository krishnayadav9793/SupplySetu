import { Response, NextFunction } from 'express';
import { Role, PriceTier } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/auth';
import { RetailersService } from './retailers.service';

export class RetailersController {
  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const profile = await RetailersService.getRetailerByUserId(req.user.id);
      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listRetailers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const search = req.query.q as string | undefined;
      const priceTier = req.query.tier as PriceTier | undefined;
      let salesmanId = req.query.salesmanId as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      // If logged in as Salesman, restrict to their assigned retailers unless overridden by Admin
      if (req.user?.role === Role.SALESMAN) {
        salesmanId = req.user.id;
      }

      const result = await RetailersService.listRetailers({
        search,
        priceTier,
        salesmanId,
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

  static async getRetailerById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const retailer = await RetailersService.getRetailerById(id);

      // If user is a retailer, make sure they cannot inspect other retailers
      if (req.user?.role === Role.RETAILER && retailer.userId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'Access denied: Retailers can only view their own profile',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: retailer,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRetailer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const updateData = req.body;

      // Only ADMIN can change creditLimit or priceTier
      if (req.user?.role !== Role.ADMIN) {
        delete updateData.creditLimit;
        delete updateData.priceTier;
        delete updateData.salesmanId;
      }

      const updated = await RetailersService.updateRetailer(id, updateData);
      res.status(200).json({
        success: true,
        message: 'Retailer updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}
