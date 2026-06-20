import { UserRepository, User, UserProfile } from '../repositories/user.repository';
import { UserRole } from '../core/types';

export class UserService {
  private userRepository = new UserRepository();

  async getProfile(userId: string): Promise<{ user: Omit<User, 'password_hash'>; profile: UserProfile | null }> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    const profile = await this.userRepository.findProfileByUserId(userId);
    const { password_hash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, profile };
  }

  async updateProfile(userId: string, data: { firstName?: string | null; lastName?: string | null; jobTitle?: string | null; avatarUrl?: string | null }): Promise<UserProfile> {
    const updated = await this.userRepository.updateUserProfile(userId, data);
    if (!updated) {
      throw new Error('Profile update failed');
    }
    return updated;
  }

  async listUsersByOrg(orgId: string): Promise<any[]> {
    return this.userRepository.listUsersByOrg(orgId);
  }

  async updateUserRole(userId: string, targetUserId: string, requesterRole: UserRole, role: UserRole): Promise<Omit<User, 'password_hash'>> {
    if (requesterRole !== UserRole.ORGANIZATION_OWNER && requesterRole !== UserRole.ORGANIZATION_ADMIN) {
      throw new Error('Access denied. Insufficient permissions.');
    }

    const requester = await this.userRepository.findUserById(userId);
    const target = await this.userRepository.findUserById(targetUserId);

    if (!requester || !target || requester.organization_id !== target.organization_id) {
      throw new Error('User not found in organization');
    }

    if (role === UserRole.ORGANIZATION_OWNER && requesterRole !== UserRole.ORGANIZATION_OWNER) {
      throw new Error('Only ORGANIZATION_OWNER can promote other users to ORGANIZATION_OWNER');
    }

    const updated = await this.userRepository.updateUserRole(targetUserId, role);
    if (!updated) {
      throw new Error('Role update failed');
    }

    const { password_hash, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}
