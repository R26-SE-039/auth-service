import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { InviteController } from '../controllers/invite.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorize';
import { validateBody } from '../middleware/validate';
import { UserRole } from '../core/types';
import { CreateInviteRequestSchema } from '../models/schemas';

export const buildOrganizationRouter = (): Router => {
  const router = Router();
  const organizationController = new OrganizationController();
  const inviteController = new InviteController();

  router.use(authenticateJWT);

  router.get('/', organizationController.getOrganization.bind(organizationController));
  router.put('/', authorizeRoles(UserRole.ORGANIZATION_OWNER), organizationController.updateOrganization.bind(organizationController));

  // Invitation management (OWNER and ADMIN can invite, only OWNER can revoke)
  router.post(
    '/invites',
    authorizeRoles(UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN),
    validateBody(CreateInviteRequestSchema),
    inviteController.createInvite.bind(inviteController)
  );
  router.get(
    '/invites',
    authorizeRoles(UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN),
    inviteController.listInvites.bind(inviteController)
  );
  router.delete(
    '/invites/:id',
    authorizeRoles(UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN),
    inviteController.revokeInvite.bind(inviteController)
  );

  return router;
};
