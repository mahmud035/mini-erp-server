import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requirePermission } from '../../middleware/requirePermission';
import { upload } from '../../middleware/upload';
import { validateRequest } from '../../middleware/validateRequest';
import { productController } from './product.controller';
import { productValidation } from './product.validation';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('product:read'), productController.getAll);
router.get(
  '/:id',
  requirePermission('product:read'),
  validateRequest(productValidation.idParam),
  productController.getById,
);

// Order: guard -> multer (parses multipart into req.body + req.file) ->
// Zod (coerces the now-populated body) -> controller.
router.post(
  '/',
  requirePermission('product:create'),
  upload.single('image'),
  validateRequest(productValidation.create),
  productController.create,
);
router.patch(
  '/:id',
  requirePermission('product:update'),
  upload.single('image'),
  validateRequest(productValidation.update),
  productController.update,
);
router.delete(
  '/:id',
  requirePermission('product:delete'),
  validateRequest(productValidation.idParam),
  productController.remove,
);

export const productRoutes = router;
