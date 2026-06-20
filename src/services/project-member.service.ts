import { ProjectMemberRepository, ProjectMemberDetail, ProjectMember } from '../repositories/project-member.repository';
import { ProjectRepository } from '../repositories/project.repository';
import { UserRepository } from '../repositories/user.repository';
import { ProjectRole, UserRole } from '../core/types';

export class ProjectMemberService {
  private projectMemberRepository = new ProjectMemberRepository();
  private projectRepository = new ProjectRepository();
  private userRepository = new UserRepository();

  private async verifyAccess(projectId: string, requesterId: string, requesterRole: UserRole, minProjectRole?: ProjectRole): Promise<boolean> {
    if (requesterRole === UserRole.ORGANIZATION_OWNER || requesterRole === UserRole.ORGANIZATION_ADMIN) {
      return true;
    }

    const memberRole = await this.projectMemberRepository.getMemberRole(projectId, requesterId);
    if (!memberRole) return false;

    if (minProjectRole === ProjectRole.PROJECT_OWNER) {
      return memberRole === ProjectRole.PROJECT_OWNER;
    }

    return true;
  }

  async addMember(projectId: string, requesterId: string, requesterRole: UserRole, targetUserId: string, role: ProjectRole): Promise<ProjectMember> {
    const isAuthorized = await this.verifyAccess(projectId, requesterId, requesterRole, ProjectRole.PROJECT_OWNER);
    if (!isAuthorized) {
      throw new Error('Access denied. Insufficient permissions to add members.');
    }

    const project = await this.projectRepository.findById(projectId);
    const targetUser = await this.userRepository.findUserById(targetUserId);

    if (!project || !targetUser) {
      throw new Error('Project or target user not found');
    }

    if (project.organization_id !== targetUser.organization_id) {
      throw new Error('Target user must belong to the same organization');
    }

    const existingRole = await this.projectMemberRepository.getMemberRole(projectId, targetUserId);
    if (existingRole) {
      throw new Error('User is already a member of this project');
    }

    return this.projectMemberRepository.addMember(projectId, targetUserId, role);
  }

  async removeMember(projectId: string, requesterId: string, requesterRole: UserRole, targetUserId: string): Promise<void> {
    const isAuthorized = await this.verifyAccess(projectId, requesterId, requesterRole, ProjectRole.PROJECT_OWNER);
    if (!isAuthorized) {
      throw new Error('Access denied. Insufficient permissions to remove members.');
    }

    const existingRole = await this.projectMemberRepository.getMemberRole(projectId, targetUserId);
    if (!existingRole) {
      throw new Error('User is not a member of this project');
    }

    if (existingRole === ProjectRole.PROJECT_OWNER && targetUserId === requesterId) {
      throw new Error('Cannot remove yourself as PROJECT_OWNER');
    }

    await this.projectMemberRepository.removeMember(projectId, targetUserId);
  }

  async listMembers(projectId: string, requesterId: string, requesterRole: UserRole): Promise<ProjectMemberDetail[]> {
    const isAuthorized = await this.verifyAccess(projectId, requesterId, requesterRole);
    if (!isAuthorized) {
      throw new Error('Access denied. Must be a project member or organization administrator to view members.');
    }

    return this.projectMemberRepository.listMembers(projectId);
  }
}
