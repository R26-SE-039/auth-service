import { IterationRepository, Iteration, CreateIterationData, UpdateIterationData } from '../repositories/iteration.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { ProjectMemberRepository } from '../repositories/project-member.repository';
import { IterationStatus, ProjectRole, UserRole } from '../core/types';

export class IterationService {
  private iterationRepository = new IterationRepository();
  private projectRepository = new ProjectRepository();
  private projectMemberRepository = new ProjectMemberRepository();

  /**
   * Verify that the requesting user has write access to the project's iterations.
   * Write access: ORGANIZATION_OWNER, ORGANIZATION_ADMIN, or PROJECT_OWNER of that project.
   */
  private async verifyWriteAccess(
    projectId: string,
    requesterId: string,
    requesterOrgRole: UserRole
  ): Promise<void> {
    if (
      requesterOrgRole === UserRole.ORGANIZATION_OWNER ||
      requesterOrgRole === UserRole.ORGANIZATION_ADMIN
    ) {
      return; // org admins always have write access
    }

    const memberRole = await this.projectMemberRepository.getMemberRole(projectId, requesterId);
    if (memberRole !== ProjectRole.PROJECT_OWNER) {
      throw new Error('Access denied. Only PROJECT_OWNER or higher can manage iterations.');
    }
  }

  /**
   * Verify that the requesting user has read access to the project.
   * Read access: any project member, ORGANIZATION_OWNER, or ORGANIZATION_ADMIN.
   */
  private async verifyReadAccess(
    projectId: string,
    requesterId: string,
    requesterOrgId: string,
    requesterOrgRole: UserRole
  ): Promise<void> {
    if (
      requesterOrgRole === UserRole.ORGANIZATION_OWNER ||
      requesterOrgRole === UserRole.ORGANIZATION_ADMIN
    ) {
      return;
    }

    const memberRole = await this.projectMemberRepository.getMemberRole(projectId, requesterId);
    if (!memberRole) {
      throw new Error('Access denied. You are not a member of this project.');
    }
  }

  /**
   * Verify the project exists and belongs to the requester's organization.
   */
  private async resolveProject(projectId: string, organizationId: string) {
    const project = await this.projectRepository.findById(projectId);
    if (!project || project.organization_id !== organizationId) {
      throw new Error('Project not found or access denied.');
    }
    return project;
  }

  async createIteration(
    projectId: string,
    requesterId: string,
    organizationId: string,
    requesterRole: UserRole,
    data: CreateIterationData
  ): Promise<Iteration> {
    await this.resolveProject(projectId, organizationId);
    await this.verifyWriteAccess(projectId, requesterId, requesterRole);

    return this.iterationRepository.create(projectId, data, requesterId);
  }

  async listIterations(
    projectId: string,
    requesterId: string,
    organizationId: string,
    requesterRole: UserRole
  ): Promise<Iteration[]> {
    await this.resolveProject(projectId, organizationId);
    await this.verifyReadAccess(projectId, requesterId, organizationId, requesterRole);

    return this.iterationRepository.findByProjectId(projectId);
  }

  async getIteration(
    iterationId: string,
    projectId: string,
    requesterId: string,
    organizationId: string,
    requesterRole: UserRole
  ): Promise<Iteration> {
    await this.resolveProject(projectId, organizationId);
    await this.verifyReadAccess(projectId, requesterId, organizationId, requesterRole);

    const iteration = await this.iterationRepository.findById(iterationId);
    if (!iteration || iteration.project_id !== projectId) {
      throw new Error('Iteration not found.');
    }

    return iteration;
  }

  async getActiveIteration(
    projectId: string,
    requesterId: string,
    organizationId: string,
    requesterRole: UserRole
  ): Promise<Iteration | null> {
    await this.resolveProject(projectId, organizationId);
    await this.verifyReadAccess(projectId, requesterId, organizationId, requesterRole);

    return this.iterationRepository.findActiveByProjectId(projectId);
  }

  async updateIteration(
    iterationId: string,
    projectId: string,
    requesterId: string,
    organizationId: string,
    requesterRole: UserRole,
    data: UpdateIterationData
  ): Promise<Iteration> {
    await this.resolveProject(projectId, organizationId);
    await this.verifyWriteAccess(projectId, requesterId, requesterRole);

    const iteration = await this.iterationRepository.findById(iterationId);
    if (!iteration || iteration.project_id !== projectId) {
      throw new Error('Iteration not found.');
    }

    // Guard: if activating, ensure no other iteration is already ACTIVE
    if (data.status === IterationStatus.ACTIVE && iteration.status !== IterationStatus.ACTIVE) {
      const activeIteration = await this.iterationRepository.findActiveByProjectId(projectId);
      if (activeIteration) {
        throw Object.assign(new Error(`Cannot activate iteration. "${activeIteration.name}" is already active. Complete or cancel it first.`), { status: 409 });
      }
    }

    const updated = await this.iterationRepository.update(iterationId, data);
    if (!updated) {
      throw new Error('Iteration could not be updated.');
    }
    return updated;
  }

  async deleteIteration(
    iterationId: string,
    projectId: string,
    requesterId: string,
    organizationId: string,
    requesterRole: UserRole
  ): Promise<void> {
    await this.resolveProject(projectId, organizationId);
    await this.verifyWriteAccess(projectId, requesterId, requesterRole);

    const iteration = await this.iterationRepository.findById(iterationId);
    if (!iteration || iteration.project_id !== projectId) {
      throw new Error('Iteration not found.');
    }

    await this.iterationRepository.delete(iterationId);
  }
}
