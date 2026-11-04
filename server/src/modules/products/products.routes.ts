import { Router } from 'express';
import { ProductsController } from './products.controller';
import { optionalAuthenticate } from '../../middleware/auth';

const router = Router();

// Allow optional authentication so retailers see tier-specific pricing,
// and guest/preview views see standard dealer pricing
router.get('/', optionalAuthenticate, ProductsController.listProducts);
router.get('/categories', ProductsController.getCategories);
router.get('/brands', ProductsController.getBrands);
router.get('/:id', optionalAuthenticate, ProductsController.getProductById);

export default router;
