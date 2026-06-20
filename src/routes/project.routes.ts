import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/authorize';
import { validateBody } from '../middleware/validate';
import { ProjectCreateRequestSchema, ProjectUpdateRequestSchema } from '../models/schemas';
import { UserRole } from '../core/types';

export const buildProjectRouter = (): Router => {
  const router = Router();
  const projectController = new ProjectController();

  router.use(authenticateJWT);

  router.post('/', authorizeRoles(UserRole.ORGANIZATION_OWNER, UserRole.ORGANIZATION_ADMIN), validateBody(ProjectCreateRequestSchema), projectController.createProject.bind(projectController));
  router.get('/', projectController.listProjects.bind(projectController));
  router.get('/:id', projectController.getProject.bind(projectController));
  router.put('/:id', validateBody(ProjectUpdateRequestSchema), projectController.updateProject.bind(projectController));
  router.delete('/:id', projectController.deleteProject.bind(projectController));

  return router;
};
