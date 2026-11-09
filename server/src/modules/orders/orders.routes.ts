import { Router } from 'express';
import { OrdersController } from './orders.controller';
import { optionalAuthenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createOrderSchema } from './orders.schema';

const router = Router();

// Order creation with Zod schema validation
router.post('/', optionalAuthenticate, validate(createOrderSchema), OrdersController.createOrder);

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

// Deliver
router.patch('/:id/deliver', optionalAuthenticate, OrdersController.deliverOrder);

// 1-Click Repeat Order
router.post('/:id/repeat', optionalAuthenticate, OrdersController.repeatOrder);

export default router;
