import { Router } from 'express';
import { IterationController } from '../controllers/iteration.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate';
import { CreateIterationRequestSchema, UpdateIterationRequestSchema } from '../models/schemas';

export const buildIterationRouter = (): Router => {
  // mergeParams: true is required to access :projectId from the parent router
  const router = Router({ mergeParams: true });
  const iterationController = new IterationController();

  router.use(authenticateJWT);

  // POST   /projects/:projectId/iterations          — create a new iteration
  router.post(
    '/',
    validateBody(CreateIterationRequestSchema),
    iterationController.createIteration.bind(iterationController)
  );

  // GET    /projects/:projectId/iterations          — list all iterations
  router.get('/', iterationController.listIterations.bind(iterationController));

  // GET    /projects/:projectId/iterations/active   — get current active sprint
  // NOTE: this route must be declared BEFORE /:id to avoid 'active' being treated as an ID
  router.get('/active', iterationController.getActiveIteration.bind(iterationController));

  // GET    /projects/:projectId/iterations/:id      — get a specific iteration
  router.get('/:id', iterationController.getIteration.bind(iterationController));

  // PUT    /projects/:projectId/iterations/:id      — update an iteration
  router.put(
    '/:id',
    validateBody(UpdateIterationRequestSchema),
    iterationController.updateIteration.bind(iterationController)
  );

  // DELETE /projects/:projectId/iterations/:id      — delete an iteration
  router.delete('/:id', iterationController.deleteIteration.bind(iterationController));

  return router;
};
