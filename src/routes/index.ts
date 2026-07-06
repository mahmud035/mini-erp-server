import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.route';
import { permissionRoutes } from '../modules/permission/permission.route';
import { roleRoutes } from '../modules/role/role.route';
import { userRoutes } from '../modules/user/user.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/permissions', permissionRoutes);
router.use('/roles', roleRoutes);
router.use('/users', userRoutes);

export default router;
