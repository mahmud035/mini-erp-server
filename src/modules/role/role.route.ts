import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validateRequest } from '../../middleware/validateRequest';
import { roleController } from './role.controller';
import { roleValidation } from './role.validation';

const router = Router();

// Every route authenticates first, then checks the specific role:* permission.
router.use(authenticate);

router.get('/', requirePermission('role:read'), roleController.getAll);
router.get(
  '/:id',
  requirePermission('role:read'),
  validateRequest(roleValidation.idParam),
  roleController.getById,
);
router.post(
  '/',
  requirePermission('role:create'),
  validateRequest(roleValidation.create),
  roleController.create,
);
router.patch(
  '/:id',
  requirePermission('role:update'),
  validateRequest(roleValidation.update),
  roleController.update,
);
router.delete(
  '/:id',
  requirePermission('role:delete'),
  validateRequest(roleValidation.idParam),
  roleController.remove,
);

export const roleRoutes = router;
