import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { dashboardController } from './dashboard.controller';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('dashboard:read'),
  dashboardController.getStats,
);

export const dashboardRoutes = router;
