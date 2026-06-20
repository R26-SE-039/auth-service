import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ProjectService } from '../services/project.service';

const projectService = new ProjectService();

export class ProjectController {
  async createProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const creatorId = req.user?.userId;
      const orgId = req.user?.organizationId;
      if (!creatorId || !orgId) throw new Error('Unauthorized');

      const project = await projectService.createProject(creatorId, orgId, req.body);
      return res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }

  async listProjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const userRole = req.user?.role;
      if (!userId || !orgId || !userRole) throw new Error('Unauthorized');

      const projects = await projectService.listProjects(userId, orgId, userRole);
      return res.status(200).json(projects);
    } catch (error) {
      next(error);
    }
  }

  async getProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.id);
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const userRole = req.user?.role;
      if (!userId || !orgId || !userRole) throw new Error('Unauthorized');

      const project = await projectService.getProject(projectId, userId, orgId, userRole);
      return res.status(200).json(project);
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.id);
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const userRole = req.user?.role;
      if (!userId || !orgId || !userRole) throw new Error('Unauthorized');

      const updated = await projectService.updateProject(projectId, userId, orgId, userRole, req.body);
      return res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.id);
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const userRole = req.user?.role;
      if (!userId || !orgId || !userRole) throw new Error('Unauthorized');

      await projectService.deleteProject(projectId, userId, orgId, userRole);
      return res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
