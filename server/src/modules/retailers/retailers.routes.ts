import { Router } from 'express';
import { RetailersController } from './retailers.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';

const router = Router();

// Retailer's own profile
router.get('/me', optionalAuthenticate, RetailersController.getMe);

// Retailer's own Khata ledger & passbook statement
router.get('/me/khata', optionalAuthenticate, RetailersController.getMyKhata);

// List retailers (Admin & Salesman)
router.get('/', optionalAuthenticate, RetailersController.listRetailers);

// Specific retailer by id
router.get('/:id', optionalAuthenticate, RetailersController.getRetailerById);

// Specific retailer's Khata statement (Admin & Salesman)
router.get('/:id/khata', optionalAuthenticate, RetailersController.getRetailerKhata);

// Record payment received against Khata dues (Admin & Salesman)
router.post('/:id/payments', optionalAuthenticate, RetailersController.recordPayment);

// Update retailer
router.put('/:id', authenticate, RetailersController.updateRetailer);

export default router;
