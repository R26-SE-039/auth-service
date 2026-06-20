import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { RegisterRequestSchema, LoginRequestSchema, RefreshTokenRequestSchema } from '../models/schemas';
import { authenticateJWT } from '../middleware/auth.middleware';

export const buildAuthRouter = (): Router => {
  const router = Router();
  const authController = new AuthController();

  router.post('/register', validateBody(RegisterRequestSchema), authController.register.bind(authController));
  router.post('/login', validateBody(LoginRequestSchema), authController.login.bind(authController));
  router.post('/refresh-token', validateBody(RefreshTokenRequestSchema), authController.refreshToken.bind(authController));
  router.post('/logout', authenticateJWT, authController.logout.bind(authController));

  return router;
};

