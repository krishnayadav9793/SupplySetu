import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AuthController {
  static async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { phone, password } = req.body;
      if (!phone) {
        res.status(400).json({ success: false, message: 'Phone number is required' });
        return;
      }

      const result = await AuthService.login(phone, password);
      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await AuthService.getMe(req.user.id);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || 'User not found',
      });
    }
  }

  static async getDemoAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const accounts = await AuthService.getDemoAccounts();
      res.status(200).json({
        success: true,
        data: accounts,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Could not fetch demo accounts',
      });
    }
  }
}
