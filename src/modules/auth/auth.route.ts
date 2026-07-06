import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validateRequest } from '../../middleware/validateRequest';
import { authController } from './auth.controller';
import { authValidation } from './auth.validation';

const router = Router();

router.post('/login', validateRequest(authValidation.login), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refresh);
router.get('/me', authenticate, authController.me);

export const authRoutes = router;
