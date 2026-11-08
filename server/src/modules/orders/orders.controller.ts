import { Response, NextFunction } from 'express';
import { Role, OrderStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/auth';
import { OrdersService } from './orders.service';
import { prisma } from '../../config';

export class OrdersController {
  static async createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { items, notes, createdVia } = req.body;
      let { retailerId, salesmanId } = req.body;

      // If logged in as retailer, ensure order belongs to their own retailer profile
      if (req.user?.role === Role.RETAILER) {
        const retailer = await prisma.retailer.findUnique({
          where: { userId: req.user.id },
        });
        if (!retailer) {
          res.status(400).json({ success: false, message: 'Retailer profile not found' });
          return;
        }
        retailerId = retailer.id;
        salesmanId = retailer.salesmanId;
      } else if (req.user?.role === Role.SALESMAN) {
        salesmanId = req.user.id;
        if (!retailerId) {
          res.status(400).json({
            success: false,
            message: 'retailerId is required when salesman punches an order',
          });
          return;
        }
      }

      const order = await OrdersService.createOrder({
        retailerId,
        salesmanId,
        items,
        notes,
        createdVia: createdVia || (req.user?.role === Role.SALESMAN ? 'SALESMAN_APP' : 'PORTAL'),
      });

      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listOrders(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as OrderStatus | undefined;
      const search = req.query.q as string | undefined;
      let retailerId = req.query.retailerId as string | undefined;
      let salesmanId = req.query.salesmanId as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      // Role scoping
      if (req.user?.role === Role.RETAILER) {
        const retailer = await prisma.retailer.findUnique({
          where: { userId: req.user.id },
        });
        if (retailer) retailerId = retailer.id;
      } else if (req.user?.role === Role.SALESMAN) {
        salesmanId = req.user.id;
      }

      const result = await OrdersService.listOrders({
        status,
        search,
        retailerId,
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

  static async getOrderById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const order = await OrdersService.getOrderById(id);

      // Verify access
      if (req.user?.role === Role.RETAILER) {
        const retailer = await prisma.retailer.findUnique({ where: { userId: req.user.id } });
        if (order.retailerId !== retailer?.id) {
          res.status(403).json({ success: false, message: 'Access denied: not your order' });
          return;
        }
      }

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  static async approveOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { notes } = req.body;

      const approved = await OrdersService.approveOrder(id, notes);
      res.status(200).json({
        success: true,
        message: `Order ${approved.orderNumber} approved and sent to warehouse for packing`,
        data: approved,
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { reason = 'Order rejected by distributor desk' } = req.body;

      const rejected = await OrdersService.rejectOrder(id, reason);
      res.status(200).json({
        success: true,
        message: `Order ${rejected.orderNumber} rejected`,
        data: rejected,
      });
    } catch (error) {
      next(error);
    }
  }

  static async dispatchOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { notes } = req.body;
      const dispatched = await OrdersService.dispatchOrder(id, notes);
      res.status(200).json({
        success: true,
        message: `Order ${dispatched.orderNumber} dispatched for delivery`,
        data: dispatched,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deliverOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { notes } = req.body;
      const delivered = await OrdersService.deliverOrder(id, notes);
      res.status(200).json({
        success: true,
        message: `Order ${delivered.orderNumber} marked as delivered to retailer`,
        data: delivered,
      });
    } catch (error) {
      next(error);
    }
  }

  static async repeatOrder(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      let targetRetailerId: string | undefined;

      if (req.user?.role === Role.RETAILER) {
        const retailer = await prisma.retailer.findUnique({
          where: { userId: req.user.id },
        });
        targetRetailerId = retailer?.id;
      }

      const newOrder = await OrdersService.repeatOrder(id, targetRetailerId);
      res.status(201).json({
        success: true,
        message: `Order successfully repeated as ${newOrder.orderNumber}`,
        data: newOrder,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDeskMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const metrics = await OrdersService.getOrderDeskMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
}
