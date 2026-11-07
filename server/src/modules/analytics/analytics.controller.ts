import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  /**
   * GET /api/analytics/overview
   */
  static async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getExecutiveOverview();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/churn-radar?threshold=14
   */
  static async getChurnRadar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string, 10) : 14;
      const data = await AnalyticsService.getChurnRadar(isNaN(threshold) ? 14 : threshold);
      res.status(200).json({
        success: true,
        count: data.length,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/financial-risk
   */
  static async getFinancialRisk(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnalyticsService.getFinancialRisk();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analytics/salesman-performance
   */
  static async getSalesmanPerformance(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const salesmanId = (req.query.salesmanId as string) || (req.user?.role === 'SALESMAN' ? req.user.id : undefined);
      const data = await AnalyticsService.getSalesmanPerformance(salesmanId);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
