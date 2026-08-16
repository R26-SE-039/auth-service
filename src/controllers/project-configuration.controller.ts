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

      const { repoUrl, personalAccessToken, jiraUrl, jiraEmail, jiraApiToken, jiraProjectKey } = req.body;

      const config = await configService.upsertConfiguration(
        projectId, userId, orgId, userRole, 
        repoUrl, personalAccessToken, 
        jiraUrl, jiraEmail, jiraApiToken, jiraProjectKey
      );
      return res.status(200).json(config);
    } catch (error) {
      next(error);
    }
  }

  async testJiraConnection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const userRole = req.user?.role;
      if (!userId || !orgId || !userRole) throw new Error('Unauthorized');

      let { jiraUrl, jiraEmail, jiraApiToken } = req.body;

      if (jiraUrl === undefined || jiraEmail === undefined || jiraApiToken === undefined) {
        const savedConfig = await configService.getConfiguration(projectId, userId, orgId, userRole);
        if (savedConfig) {
          if (jiraUrl === undefined) jiraUrl = savedConfig.jira_url;
          if (jiraEmail === undefined) jiraEmail = savedConfig.jira_email;
          if (jiraApiToken === undefined) jiraApiToken = savedConfig.jira_api_token;
        }
      }

      if (!jiraUrl || !jiraEmail || !jiraApiToken) {
        return res.status(400).json({ success: false, message: 'Jira configuration is incomplete' });
      }

      const storyServiceUrl = process.env.STORY_SERVICE_URL || 'http://localhost:8001';
      const response = await fetch(`${storyServiceUrl}/api/v1/jira/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || '',
        },
        body: JSON.stringify({ jiraUrl, jiraEmail, jiraApiToken }),
      });

      if (!response.ok) {
        const body: any = await response.json().catch(() => ({}));
        return res.status(response.status).json({
          success: false,
          message: body.detail || 'Jira connection test failed'
        });
      }

      const result = await response.json();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
