import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.route';
import { customerRoutes } from '../modules/customer/customer.route';
import { dashboardRoutes } from '../modules/dashboard/dashboard.route';
import { permissionRoutes } from '../modules/permission/permission.route';
import { productRoutes } from '../modules/product/product.route';
import { roleRoutes } from '../modules/role/role.route';
import { saleRoutes } from '../modules/sale/sale.route';
import { userRoutes } from '../modules/user/user.route';

const router = Router();

router.use('/auth', authRoutes);
router.use('/permissions', permissionRoutes);
router.use('/roles', roleRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/customers', customerRoutes);
router.use('/sales', saleRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
