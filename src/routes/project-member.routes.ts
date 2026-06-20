import { Router } from 'express';
import { ProjectMemberController } from '../controllers/project-member.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate';
import { ProjectMemberAddRequestSchema } from '../models/schemas';

export const buildProjectMemberRouter = (): Router => {
  const router = Router();
  const projectMemberController = new ProjectMemberController();

  router.use(authenticateJWT);

  router.post('/:projectId/members', validateBody(ProjectMemberAddRequestSchema), projectMemberController.addMember.bind(projectMemberController));
  router.delete('/:projectId/members/:userId', projectMemberController.removeMember.bind(projectMemberController));
  router.get('/:projectId/members', projectMemberController.listMembers.bind(projectMemberController));

  return router;
};
