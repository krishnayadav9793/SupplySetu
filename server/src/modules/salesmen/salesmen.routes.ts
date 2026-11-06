import { Router } from 'express';
import { SalesmenController } from './salesmen.controller';
import { optionalAuthenticate } from '../../middleware/auth';

const router = Router();

// List all salesmen (Admin)
router.get('/', optionalAuthenticate, SalesmenController.listSalesmen);

// Create new salesman (Admin)
router.post('/', optionalAuthenticate, SalesmenController.createSalesman);

// Assign shops to salesman (Admin)
router.post('/assign-shops', optionalAuthenticate, SalesmenController.assignShops);

export default router;
