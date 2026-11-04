import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { ExportsService } from './exports.service';

export class ExportsController {
  static async downloadTallyCsv(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { csvContent, filename, orderCount, totalAmount } = await ExportsService.generateTallyCsv();

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('X-Total-Orders', orderCount.toString());
      res.setHeader('X-Total-Amount', totalAmount.toString());

      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }

  static async getExportHistory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const history = await ExportsService.getExportHistory();
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}
