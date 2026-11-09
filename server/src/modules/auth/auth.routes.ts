import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.schema';

const router = Router();

// Public routes with Zod request validation
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);
router.get('/demo-accounts', AuthController.getDemoAccounts);

// Protected routes
router.get('/me', authenticate, AuthController.me);
router.post('/avatar', authenticate, AuthController.updateAvatar);
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword
);

export default router;
