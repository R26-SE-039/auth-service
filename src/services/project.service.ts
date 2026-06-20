import { ProjectRepository, Project } from '../repositories/project.repository';
import { ProjectMemberRepository } from '../repositories/project-member.repository';
import { ProjectRole, UserRole } from '../core/types';
import { getClient } from '../config/database';

export class ProjectService {
  private projectRepository = new ProjectRepository();
  private projectMemberRepository = new ProjectMemberRepository();

  async createProject(creatorId: string, organizationId: string, data: { name: string; description?: string | null }): Promise<Project> {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const project = await this.projectRepository.create(organizationId, data.name, data.description, client);
      await this.projectMemberRepository.addMember(project.id, creatorId, ProjectRole.PROJECT_OWNER, client);

      await client.query('COMMIT');
      return project;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listProjects(userId: string, organizationId: string, userRole: UserRole): Promise<Project[]> {
    if (userRole === UserRole.ORGANIZATION_OWNER || userRole === UserRole.ORGANIZATION_ADMIN) {
      return this.projectRepository.findByOrgId(organizationId);
    }
    return this.projectRepository.listProjectsForMember(userId, organizationId);
  }

  async getProject(projectId: string, userId: string, organizationId: string, userRole: UserRole): Promise<Project> {
    const project = await this.projectRepository.findById(projectId);
    if (!project || project.organization_id !== organizationId) {
      throw new Error('Project not found or access denied');
    }

    if (userRole === UserRole.ORGANIZATION_OWNER || userRole === UserRole.ORGANIZATION_ADMIN) {
      return project;
    }

    const memberRole = await this.projectMemberRepository.getMemberRole(projectId, userId);
    if (!memberRole) {
      throw new Error('Access denied. Not a project member.');
    }

    return project;
  }

  async updateProject(projectId: string, userId: string, organizationId: string, userRole: UserRole, data: { name?: string; description?: string | null; status?: string }): Promise<Project> {
    const project = await this.projectRepository.findById(projectId);
    if (!project || project.organization_id !== organizationId) {
      throw new Error('Project not found or access denied');
    }

    let isAuthorized = false;
    if (userRole === UserRole.ORGANIZATION_OWNER || userRole === UserRole.ORGANIZATION_ADMIN) {
      isAuthorized = true;
    } else {
      const memberRole = await this.projectMemberRepository.getMemberRole(projectId, userId);
      if (memberRole === ProjectRole.PROJECT_OWNER) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new Error('Access denied. Insufficient permissions to update project.');
    }

    const updated = await this.projectRepository.update(projectId, data);
    if (!updated) {
      throw new Error('Project could not be updated');
    }
    return updated;
  }

  async deleteProject(projectId: string, userId: string, organizationId: string, userRole: UserRole): Promise<void> {
    const project = await this.projectRepository.findById(projectId);
    if (!project || project.organization_id !== organizationId) {
      throw new Error('Project not found or access denied');
    }

    let isAuthorized = false;
    if (userRole === UserRole.ORGANIZATION_OWNER || userRole === UserRole.ORGANIZATION_ADMIN) {
      isAuthorized = true;
    } else {
      const memberRole = await this.projectMemberRepository.getMemberRole(projectId, userId);
      if (memberRole === ProjectRole.PROJECT_OWNER) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new Error('Access denied. Insufficient permissions to delete project.');
    }

    await this.projectRepository.delete(projectId);
  }
}
