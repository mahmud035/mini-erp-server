import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validateRequest } from '../../middleware/validateRequest';
import { customerController } from './customer.controller';
import { customerValidation } from './customer.validation';

const router = Router();

router.use(authenticate);

// customer:read is granted to Employee too (sale dropdown); writes are not.
router.get('/', requirePermission('customer:read'), customerController.getAll);
router.get(
  '/:id',
  requirePermission('customer:read'),
  validateRequest(customerValidation.idParam),
  customerController.getById,
);
router.post(
  '/',
  requirePermission('customer:create'),
  validateRequest(customerValidation.create),
  customerController.create,
);
router.patch(
  '/:id',
  requirePermission('customer:update'),
  validateRequest(customerValidation.update),
  customerController.update,
);
router.delete(
  '/:id',
  requirePermission('customer:delete'),
  validateRequest(customerValidation.idParam),
  customerController.remove,
);

export const customerRoutes = router;
