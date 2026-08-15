import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ProjectConfigurationService } from '../services/project-configuration.service';

const configService = new ProjectConfigurationService();

export class ProjectConfigurationController {
  async getConfiguration(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const userRole = req.user?.role;
      if (!userId || !orgId || !userRole) throw new Error('Unauthorized');

      const config = await configService.getConfiguration(
        projectId, userId, orgId, userRole
      );

      if (!config) {
        return res.status(404).json({ message: 'No project configuration found.' });
      }
      return res.status(200).json(config);
    } catch (error) {
      next(error);
    }
  }

  async upsertConfiguration(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const userRole = req.user?.role;
      if (!userId || !orgId || !userRole) throw new Error('Unauthorized');

      const { repoUrl, personalAccessToken } = req.body;

      const config = await configService.upsertConfiguration(
        projectId, userId, orgId, userRole, repoUrl, personalAccessToken
      );
      return res.status(200).json(config);
    } catch (error) {
      next(error);
    }
  }
}
