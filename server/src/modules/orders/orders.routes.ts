import { Router } from 'express';
import { OrdersController } from './orders.controller';
import { authenticate, requireRoles, optionalAuthenticate } from '../../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Order creation (supports both authenticated retailers/salesmen and guest demo checkout)
router.post('/', optionalAuthenticate, OrdersController.createOrder);

// Order listing (scoped by role)
router.get('/', optionalAuthenticate, OrdersController.listOrders);

// Order Desk summary metrics (Admin)
router.get('/metrics', optionalAuthenticate, OrdersController.getDeskMetrics);

// Single order details
router.get('/:id', optionalAuthenticate, OrdersController.getOrderById);

// Order Approval workflow (Admin only in production)
router.patch('/:id/approve', optionalAuthenticate, OrdersController.approveOrder);

// Order Rejection workflow
router.patch('/:id/reject', optionalAuthenticate, OrdersController.rejectOrder);

// Dispatch
router.patch('/:id/dispatch', optionalAuthenticate, OrdersController.dispatchOrder);

export default router;
