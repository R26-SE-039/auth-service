import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { InviteService } from '../services/invite.service';

const inviteService = new InviteService();

export class InviteController {
  // POST /organizations/invites
  async createInvite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const inviterUserId = req.user!.userId;
      const inviterOrgId = req.user!.organizationId;
      const { email, role } = req.body;

      const result = await inviteService.createInvite(inviterUserId, inviterOrgId, email, role);
      return res.status(201).json({
        message: `Invitation sent to ${result.email}.`,
        inviteId: result.inviteId,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /auth/accept-invite
  async acceptInvite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { inviteToken, firstName, lastName, password } = req.body;
      const result = await inviteService.acceptInvite(inviteToken, firstName, lastName, password);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /organizations/invites
  async listInvites(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user!.organizationId;
      const invites = await inviteService.listInvites(orgId);
      return res.status(200).json(invites);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /organizations/invites/:id
  async revokeInvite(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const inviteId = String(req.params.id);
      const orgId = req.user!.organizationId;
      await inviteService.revokeInvite(inviteId, orgId);
      return res.status(200).json({ message: 'Invitation revoked successfully.' });
    } catch (error) {
      next(error);
    }
  }
}
