import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { validateRequest } from '../../middleware/validateRequest';
import { userController } from './user.controller';
import { userValidation } from './user.validation';

const router = Router();

// Every route authenticates first, then checks the specific user:* permission.
router.use(authenticate);

router.get('/', requirePermission('user:read'), userController.getAll);
router.get(
  '/:id',
  requirePermission('user:read'),
  validateRequest(userValidation.idParam),
  userController.getById,
);
router.post(
  '/',
  requirePermission('user:create'),
  validateRequest(userValidation.create),
  userController.create,
);
router.patch(
  '/:id',
  requirePermission('user:update'),
  validateRequest(userValidation.update),
  userController.update,
);
router.delete(
  '/:id',
  requirePermission('user:delete'),
  validateRequest(userValidation.idParam),
  userController.remove,
);

export const userRoutes = router;
