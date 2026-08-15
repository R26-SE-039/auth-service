import { ProjectConfigurationRepository, ProjectConfiguration } from '../repositories/project-configuration.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { ProjectMemberRepository } from '../repositories/project-member.repository';
import { ProjectRole, UserRole } from '../core/types';
import { encrypt, decrypt } from '../core/security';
import { loadSettings } from '../config/config';

export class ProjectConfigurationService {
  private configRepository = new ProjectConfigurationRepository();
  private projectRepository = new ProjectRepository();
  private projectMemberRepository = new ProjectMemberRepository();
  private settings = loadSettings();

  /**
   * Verify that the requesting user has write access to the project's configurations.
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
      throw Object.assign(
        new Error('Access denied. Only PROJECT_OWNER or higher can manage project configurations.'),
        { status: 403 }
      );
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
      throw Object.assign(
        new Error('Access denied. You are not a member of this project.'),
        { status: 403 }
      );
    }
  }

  /**
   * Verify the project exists and belongs to the requester's organization.
   */
  private async resolveProject(projectId: string, organizationId: string) {
    const project = await this.projectRepository.findById(projectId);
    if (!project || project.organization_id !== organizationId) {
      throw Object.assign(
        new Error('Project not found or access denied.'),
        { status: 404 }
      );
    }
    return project;
  }

  async getConfiguration(
    projectId: string,
    requesterId: string,
    organizationId: string,
    requesterRole: UserRole
  ): Promise<ProjectConfiguration | null> {
    await this.resolveProject(projectId, organizationId);
    await this.verifyReadAccess(projectId, requesterId, organizationId, requesterRole);

    const config = await this.configRepository.findByProjectId(projectId);
    if (!config) {
      return null;
    }

    // Decrypt the personal access token
    try {
      config.personal_access_token = decrypt(config.personal_access_token, this.settings.encryptionKey);
    } catch (err: any) {
      console.error('[ProjectConfigurationService] Decryption failed:', err.message);
      throw new Error('Failed to decrypt project credentials');
    }

    return config;
  }

  async upsertConfiguration(
    projectId: string,
    requesterId: string,
    organizationId: string,
    requesterRole: UserRole,
    repoUrl: string,
    personalAccessToken: string
  ): Promise<ProjectConfiguration> {
    await this.resolveProject(projectId, organizationId);
    await this.verifyWriteAccess(projectId, requesterId, requesterRole);

    // Encrypt the personal access token before saving
    const encryptedToken = encrypt(personalAccessToken, this.settings.encryptionKey);

    const config = await this.configRepository.upsert(projectId, repoUrl, encryptedToken);

    // Decrypt the token in the returned object so the client gets the plaintext
    config.personal_access_token = personalAccessToken;
    return config;
  }
}
