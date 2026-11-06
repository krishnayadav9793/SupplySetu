import { Router } from 'express';
import { Role } from '@prisma/client';
import { ProductsController } from './products.controller';
import { authenticate, optionalAuthenticate, requireRoles } from '../../middleware/auth';

const router = Router();

// Allow optional authentication so retailers see tier-specific pricing,
// and guest/preview views see standard dealer pricing
router.get('/', optionalAuthenticate, ProductsController.listProducts);
router.get('/categories', ProductsController.getCategories);
router.get('/brands', ProductsController.getBrands);

// Schemes routes (must be before /:id)
router.get('/schemes', optionalAuthenticate, ProductsController.listSchemes);
router.post('/schemes', authenticate, requireRoles(Role.ADMIN), ProductsController.createScheme);
router.patch('/schemes/:id/status', authenticate, requireRoles(Role.ADMIN), ProductsController.toggleSchemeStatus);
router.delete('/schemes/:id', authenticate, requireRoles(Role.ADMIN), ProductsController.deleteScheme);

// Product Admin routes
router.post('/', authenticate, requireRoles(Role.ADMIN), ProductsController.createProduct);
router.patch('/:id/stock', authenticate, requireRoles(Role.ADMIN, Role.SALESMAN), ProductsController.updateStock);
router.put('/:id', authenticate, requireRoles(Role.ADMIN), ProductsController.updateProduct);
router.delete('/:id', authenticate, requireRoles(Role.ADMIN), ProductsController.deleteProduct);

// Product Detail
router.get('/:id', optionalAuthenticate, ProductsController.getProductById);

export default router;
