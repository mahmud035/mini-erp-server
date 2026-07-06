import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validateRequest } from '../../middleware/validateRequest';
import { saleController } from './sale.controller';
import { saleValidation } from './sale.validation';

const router = Router();

router.use(authenticate);

// Immutable resource: create + read only. No PATCH/DELETE.
router.post(
  '/',
  requirePermission('sale:create'),
  validateRequest(saleValidation.create),
  saleController.create,
);
router.get('/', requirePermission('sale:read'), saleController.getAll);
router.get(
  '/:id',
  requirePermission('sale:read'),
  validateRequest(saleValidation.idParam),
  saleController.getById,
);

export const saleRoutes = router;
