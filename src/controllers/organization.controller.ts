import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { OrganizationService } from '../services/organization.service';

const organizationService = new OrganizationService();

export class OrganizationController {
  async getOrganization(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) throw new Error('Unauthorized');
      
      const org = await organizationService.getOrganization(orgId);
      return res.status(200).json(org);
    } catch (error) {
      next(error);
    }
  }

  async updateOrganization(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const orgId = req.user?.organizationId;
      if (!orgId) throw new Error('Unauthorized');

      const updated = await organizationService.updateOrganization(orgId, req.body);
      return res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }
}
