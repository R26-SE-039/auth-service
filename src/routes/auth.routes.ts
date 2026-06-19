import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

export const buildAuthRouter = (): Router => {
  const router = Router();
  const authController = new AuthController();

  router.post('/register', authController.register.bind(authController));
  router.post('/login', authController.login.bind(authController));
  router.post('/refresh-token', authController.refreshToken.bind(authController));
  router.post('/logout', authController.logout.bind(authController));

  return router;
};
