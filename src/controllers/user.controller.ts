import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserService } from '../services/user.service';

const userService = new UserService();

export class UserController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error('Unauthorized');

      const profile = await userService.getProfile(userId);
      return res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error('Unauthorized');

      const updated = await userService.updateProfile(userId, req.body);
      return res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) throw new Error('Unauthorized');

      const users = await userService.listUsersByOrg(orgId);
      return res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const requesterRole = req.user?.role;
      if (!userId || !requesterRole) throw new Error('Unauthorized');

      const targetUserId = String(req.params.id);
      const { role } = req.body;

      const updated = await userService.updateUserRole(userId, targetUserId, requesterRole, role);
      return res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }
}
