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
    if (config.personal_access_token) {
      try {
        config.personal_access_token = decrypt(config.personal_access_token, this.settings.encryptionKey);
      } catch (err: any) {
        console.error('[ProjectConfigurationService] Git Decryption failed:', err.message);
        throw new Error('Failed to decrypt project Git credentials');
      }
    }

    // Decrypt the Jira API token
    if (config.jira_api_token) {
      try {
        config.jira_api_token = decrypt(config.jira_api_token, this.settings.encryptionKey);
      } catch (err: any) {
        console.error('[ProjectConfigurationService] Jira Decryption failed:', err.message);
        throw new Error('Failed to decrypt project Jira credentials');
      }
    }

    return config;
  }

  async upsertConfiguration(
    projectId: string,
    requesterId: string,
    organizationId: string,
    requesterRole: UserRole,
    repoUrl?: string,
    personalAccessToken?: string,
    jiraUrl?: string | null,
    jiraEmail?: string | null,
    jiraApiToken?: string | null,
    jiraProjectKey?: string | null
  ): Promise<ProjectConfiguration> {
    await this.resolveProject(projectId, organizationId);
    await this.verifyWriteAccess(projectId, requesterId, requesterRole);

    const existing = await this.configRepository.findByProjectId(projectId);
    if (existing) {
      if (existing.personal_access_token) {
        try {
          existing.personal_access_token = decrypt(existing.personal_access_token, this.settings.encryptionKey);
        } catch {}
      }
      if (existing.jira_api_token) {
        try {
          existing.jira_api_token = decrypt(existing.jira_api_token, this.settings.encryptionKey);
        } catch {}
      }
    }

    const finalRepoUrl = repoUrl !== undefined ? repoUrl : (existing ? existing.repo_url : '');
    const finalPatRaw = personalAccessToken !== undefined ? personalAccessToken : (existing ? existing.personal_access_token : '');
    const finalJiraUrl = jiraUrl !== undefined ? jiraUrl : (existing ? existing.jira_url : null);
    const finalJiraEmail = jiraEmail !== undefined ? jiraEmail : (existing ? existing.jira_email : null);
    const finalJiraApiTokenRaw = jiraApiToken !== undefined ? jiraApiToken : (existing ? existing.jira_api_token : null);
    const finalJiraProjectKey = jiraProjectKey !== undefined ? jiraProjectKey : (existing ? existing.jira_project_key : null);

    // Encrypt Git Token if it's set
    const encryptedPat = finalPatRaw ? encrypt(finalPatRaw, this.settings.encryptionKey) : '';

    // Encrypt Jira Token if it's set
    const encryptedJiraToken = finalJiraApiTokenRaw ? encrypt(finalJiraApiTokenRaw, this.settings.encryptionKey) : null;

    const config = await this.configRepository.upsert(
      projectId,
      finalRepoUrl,
      encryptedPat,
      finalJiraUrl,
      finalJiraEmail,
      encryptedJiraToken,
      finalJiraProjectKey
    );

    // Decrypt in response object
    if (config.personal_access_token) {
      config.personal_access_token = finalPatRaw;
    }
    if (config.jira_api_token) {
      config.jira_api_token = finalJiraApiTokenRaw;
    }
    return config;
  }
}
