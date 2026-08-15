import { Router } from 'express';
import { ProjectConfigurationController } from '../controllers/project-configuration.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate';
import { SaveConfigurationRequestSchema } from '../models/schemas';

export const buildProjectConfigurationRouter = (): Router => {
  // mergeParams: true is required to access :projectId from the parent router
  const router = Router({ mergeParams: true });
  const configController = new ProjectConfigurationController();

  router.use(authenticateJWT);

  // GET    /projects/:projectId/configuration — get project configuration (decrypted)
  router.get('/', configController.getConfiguration.bind(configController));

  // POST   /projects/:projectId/configuration — save/update configuration (encrypts PAT)
  router.post(
    '/',
    validateBody(SaveConfigurationRequestSchema),
    configController.upsertConfiguration.bind(configController)
  );

  return router;
};
