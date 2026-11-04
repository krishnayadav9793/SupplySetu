import { Router } from 'express';
import { RetailersController } from './retailers.controller';
import { authenticate, requireRoles } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Retailer's own profile
router.get('/me', authenticate, RetailersController.getMe);

// List retailers (Admin & Salesman)
router.get('/', authenticate, requireRoles(Role.ADMIN, Role.SALESMAN), RetailersController.listRetailers);

// Specific retailer by id
router.get('/:id', authenticate, RetailersController.getRetailerById);

// Update retailer
router.put('/:id', authenticate, RetailersController.updateRetailer);

export default router;
