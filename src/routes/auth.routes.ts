import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { InviteController } from '../controllers/invite.controller';
import { validateBody } from '../middleware/validate';
import { RegisterRequestSchema, LoginRequestSchema, RefreshTokenRequestSchema, AcceptInviteRequestSchema } from '../models/schemas';
import { authenticateJWT, optionalAuthJWT } from '../middleware/auth.middleware';

export const buildAuthRouter = (): Router => {
  const router = Router();
  const authController = new AuthController();
  const inviteController = new InviteController();

  router.post('/register', validateBody(RegisterRequestSchema), authController.register.bind(authController));
  router.post('/login', validateBody(LoginRequestSchema), authController.login.bind(authController));
  router.post('/refresh-token', validateBody(RefreshTokenRequestSchema), authController.refreshToken.bind(authController));
  router.post('/logout', optionalAuthJWT, authController.logout.bind(authController));

  // Invitation flow - public endpoint to accept an invite and create account
  router.post('/accept-invite', validateBody(AcceptInviteRequestSchema), inviteController.acceptInvite.bind(inviteController));

  return router;
};

