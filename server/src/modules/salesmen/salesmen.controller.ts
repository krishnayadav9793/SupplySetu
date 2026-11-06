import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { SalesmenService } from './salesmen.service';

export class SalesmenController {
  static async listSalesmen(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const salesmen = await SalesmenService.listSalesmen();
      res.status(200).json({
        success: true,
        data: salesmen,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createSalesman(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { name, phone, password, assignedRetailerIds } = req.body;
      const salesman = await SalesmenService.createSalesman({
        name,
        phone,
        password,
        assignedRetailerIds,
      });

      res.status(201).json({
        success: true,
        message: `Salesman ${salesman.name} created successfully`,
        data: salesman,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create salesman',
      });
    }
  }

  static async assignShops(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { salesmanId, retailerIds } = req.body;
      if (!salesmanId || !retailerIds) {
        res.status(400).json({ success: false, message: 'salesmanId and retailerIds are required' });
        return;
      }

      const result = await SalesmenService.assignShops(salesmanId, retailerIds);
      res.status(200).json({
        success: true,
        message: 'Shops assigned successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to assign shops',
      });
    }
  }
}
