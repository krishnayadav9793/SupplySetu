import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { phone, password, name, role, shopName, address, city, state, pincode, gstNumber } =
        req.body;
      if (!phone || !name) {
        res.status(400).json({ success: false, message: 'Phone number and name are required' });
        return;
      }

      const result = await AuthService.register({
        phone,
        password,
        name,
        role,
        shopName,
        address,
        city,
        state,
        pincode,
        gstNumber,
      });

      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  }

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

  static async resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { phone, newPassword } = req.body;
      const result = await AuthService.resetPassword(phone, newPassword);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Password update failed',
      });
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { newPassword, currentPassword } = req.body;
      const result = await AuthService.changePassword(req.user.id, newPassword, currentPassword);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Password update failed',
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
