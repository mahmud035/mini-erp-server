import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { permissionController } from './permission.controller';

const router = Router();

// Reading the catalog is part of role management, so it is gated by role:read.
router.get(
  '/',
  authenticate,
  requirePermission('role:read'),
  permissionController.getAll,
);

export const permissionRoutes = router;
