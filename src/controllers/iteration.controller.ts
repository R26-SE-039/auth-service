import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { IterationService } from '../services/iteration.service';

const iterationService = new IterationService();

export class IterationController {
  async createIteration(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const userRole = req.user?.role;
      if (!userId || !orgId || !userRole) throw new Error('Unauthorized');

      const iteration = await iterationService.createIteration(
        projectId, userId, orgId, userRole, req.body
      );
      return res.status(201).json(iteration);
    } catch (error) {
      next(error);
    }
  }

  async listIterations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const userRole = req.user?.role;
      if (!userId || !orgId || !userRole) throw new Error('Unauthorized');

      const iterations = await iterationService.listIterations(
        projectId, userId, orgId, userRole
      );
      return res.status(200).json(iterations);
    } catch (error) {
      next(error);
    }
  }

  async getActiveIteration(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const userRole = req.user?.role;
      if (!userId || !orgId || !userRole) throw new Error('Unauthorized');

      const iteration = await iterationService.getActiveIteration(
        projectId, userId, orgId, userRole
      );

      if (!iteration) {
        return res.status(404).json({ message: 'No active iteration found for this project.' });
      }
      return res.status(200).json(iteration);
    } catch (error) {
      next(error);
    }
  }

  async getIteration(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const iterationId = String(req.params.id);
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const userRole = req.user?.role;
      if (!userId || !orgId || !userRole) throw new Error('Unauthorized');

      const iteration = await iterationService.getIteration(
        iterationId, projectId, userId, orgId, userRole
      );
      return res.status(200).json(iteration);
    } catch (error) {
      next(error);
    }
  }

  async updateIteration(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const iterationId = String(req.params.id);
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const userRole = req.user?.role;
      if (!userId || !orgId || !userRole) throw new Error('Unauthorized');

      const updated = await iterationService.updateIteration(
        iterationId, projectId, userId, orgId, userRole, req.body
      );
      return res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  async deleteIteration(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projectId = String(req.params.projectId);
      const iterationId = String(req.params.id);
      const userId = req.user?.userId;
      const orgId = req.user?.organizationId;
      const userRole = req.user?.role;
      if (!userId || !orgId || !userRole) throw new Error('Unauthorized');

      await iterationService.deleteIteration(
        iterationId, projectId, userId, orgId, userRole
      );
      return res.status(200).json({ message: 'Iteration deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }
}
