import { OrganizationRepository, Organization } from '../repositories/organization.repository';

export class OrganizationService {
  private organizationRepository = new OrganizationRepository();

  async getOrganization(id: string): Promise<Organization> {
    const org = await this.organizationRepository.findById(id);
    if (!org) {
      throw new Error('Organization not found');
    }
    return org;
  }

  async updateOrganization(id: string, data: { companyName?: string; domain?: string }): Promise<Organization> {
    const org = await this.organizationRepository.update(id, data);
    if (!org) {
      throw new Error('Organization not found');
    }
    return org;
  }
}
