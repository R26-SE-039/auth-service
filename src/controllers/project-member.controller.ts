import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ProjectMemberService } from '../services/project-member.service';

const projectMemberService = new ProjectMemberService();

export class ProjectMemberController {
  async addMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const requesterId = req.user?.userId;
      const requesterRole = req.user?.role;
      if (!requesterId || !requesterRole) throw new Error('Unauthorized');

      const { userId, role } = req.body;
      const member = await projectMemberService.addMember(projectId, requesterId, requesterRole, userId, role);
      return res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const targetUserId = String(req.params.userId);
      const requesterId = req.user?.userId;
      const requesterRole = req.user?.role;
      if (!requesterId || !requesterRole) throw new Error('Unauthorized');

      await projectMemberService.removeMember(projectId, requesterId, requesterRole, targetUserId);
      return res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async listMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const requesterId = req.user?.userId;
      const requesterRole = req.user?.role;
      if (!requesterId || !requesterRole) throw new Error('Unauthorized');

      const members = await projectMemberService.listMembers(projectId, requesterId, requesterRole);
      return res.status(200).json(members);
    } catch (error) {
      next(error);
    }
  }
}
