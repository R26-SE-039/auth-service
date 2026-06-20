import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorize';
import { UserRole } from '../core/types';

export const buildOrganizationRouter = (): Router => {
  const router = Router();
  const organizationController = new OrganizationController();

  router.use(authenticateJWT);

  router.get('/', organizationController.getOrganization.bind(organizationController));
  router.put('/', authorizeRoles(UserRole.ORGANIZATION_OWNER), organizationController.updateOrganization.bind(organizationController));

  return router;
};
