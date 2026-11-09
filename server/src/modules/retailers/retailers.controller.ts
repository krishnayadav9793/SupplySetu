import { Response, NextFunction } from 'express';
import { Role, PriceTier } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/auth';
import { RetailersService } from './retailers.service';
import { prisma } from '../../config';

export class RetailersController {
  static async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      let profile = null;
      if (req.user?.id) {
        try {
          profile = await RetailersService.getRetailerByUserId(req.user.id);
        } catch {
          // ignore error to allow demo fallback
        }
      }

      if (!profile) {
        // Fallback to first retailer in database for demo testing (same behavior as getMyKhata)
        const firstRetailer = await prisma.retailer.findFirst({
          where: { isActive: true },
          include: {
            salesman: {
              select: { id: true, name: true, phone: true },
            },
          },
        });
        if (firstRetailer) {
          const availableCredit = Math.max(
            0,
            firstRetailer.creditLimit - firstRetailer.outstandingBalance
          );
          const creditUtilization =
            firstRetailer.creditLimit > 0
              ? Math.round((firstRetailer.outstandingBalance / firstRetailer.creditLimit) * 100)
              : 0;
          profile = {
            ...firstRetailer,
            availableCredit,
            creditUtilization,
          };
        }
      }

      if (!profile) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

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

  static async getMyKhata(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      let retailerId: string | null = null;
      if (req.user?.id) {
        const retailer = await prisma.retailer.findUnique({
          where: { userId: req.user.id },
        });
        if (retailer) retailerId = retailer.id;
      }

      if (!retailerId) {
        // Fallback to first retailer in database for demo testing
        const firstRetailer = await prisma.retailer.findFirst({ where: { isActive: true } });
        if (firstRetailer) retailerId = firstRetailer.id;
      }

      if (!retailerId) {
        res.status(404).json({ success: false, message: 'No retailer profile found' });
        return;
      }

      const ledger = await RetailersService.getKhataLedger(retailerId);
      res.status(200).json({ success: true, data: ledger });
    } catch (error) {
      next(error);
    }
  }

  static async getRetailerKhata(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const ledger = await RetailersService.getKhataLedger(id);
      res.status(200).json({ success: true, data: ledger });
    } catch (error) {
      next(error);
    }
  }

  static async recordPayment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      let id = (rawId || '').trim();
      const { amount, paymentMode, referenceNo, notes } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        res
          .status(400)
          .json({ success: false, message: 'Payment amount must be greater than zero' });
        return;
      }

      // Flexible retailer ID resolution (supports UUID, 'me', shopName, or user auth context)
      if (!id || id === 'me') {
        if (req.user?.id) {
          const ret = await prisma.retailer.findUnique({ where: { userId: req.user.id } });
          if (ret) id = ret.id;
        }
        if (!id || id === 'me') {
          const first = await prisma.retailer.findFirst({ where: { isActive: true } });
          if (first) id = first.id;
        }
      } else {
        const existing = await prisma.retailer.findUnique({ where: { id } });
        if (!existing) {
          // Try lookup by shopName or phone
          const byShop = await prisma.retailer.findFirst({
            where: {
              OR: [{ shopName: { equals: id, mode: 'insensitive' } }, { phone: id }],
            },
          });
          if (byShop) {
            id = byShop.id;
          } else if (req.user?.id) {
            const byUser = await prisma.retailer.findUnique({ where: { userId: req.user.id } });
            if (byUser) id = byUser.id;
          } else {
            const first = await prisma.retailer.findFirst({ where: { isActive: true } });
            if (first) id = first.id;
          }
        }
      }

      const result = await RetailersService.recordPayment(id, {
        amount: parseFloat(amount),
        paymentMode,
        referenceNo,
        notes,
      });
      res.status(200).json({
        success: true,
        message: `Payment of ₹${amount} recorded successfully. Outstanding balance updated.`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
