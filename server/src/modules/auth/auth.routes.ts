import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/demo-accounts', AuthController.getDemoAccounts);

// Protected routes
router.get('/me', authenticate, AuthController.me);

export default router;
