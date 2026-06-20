import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorize';
import { validateBody } from '../middleware/validate';
import { UserProfileUpsertRequestSchema, UpdateRoleRequestSchema } from '../models/schemas';
import { UserRole } from '../core/types';

export const buildUserRouter = (): Router => {
  const router = Router();
  const userController = new UserController();

  router.use(authenticateJWT);

  router.get('/me', userController.getProfile.bind(userController));
  router.put('/me/profile', validateBody(UserProfileUpsertRequestSchema), userController.updateProfile.bind(userController));
  
  router.get('/', authorizeRoles(UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN), userController.listUsers.bind(userController));
  router.put('/:id/role', authorizeRoles(UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN), validateBody(UpdateRoleRequestSchema), userController.updateUserRole.bind(userController));

  return router;
};
