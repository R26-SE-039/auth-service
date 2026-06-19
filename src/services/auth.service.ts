import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { loadSettings } from '../config/config';

const settings = loadSettings();
const userRepository = new UserRepository();

export class AuthService {
  async register(data: { email: string; password: string; companyName: string; firstName: string; lastName: string }) {
    const existingUser = await userRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    const org = await userRepository.createOrganization(data.companyName);
    
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    const user = await userRepository.createUser(org.id, data.email, passwordHash, 'admin');

    await userRepository.createUserProfile(user.id, data.firstName, data.lastName);

    const token = this.generateToken(user);

    return { token, user: { id: user.id, email: user.email, role: user.role, organizationId: user.organization_id } };
  }

  async login(email: string, password: string) {
    const user = await userRepository.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid credentials.');
    }

    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return { token, refreshToken, user: { id: user.id, email: user.email, role: user.role, organizationId: user.organization_id } };
  }

  private generateToken(user: any) {
    return jwt.sign(
      { userId: user.id, organizationId: user.organization_id, role: user.role },
      settings.authSecret,
      { expiresIn: `${settings.accessTokenTtlMinutes}m` }
    );
  }

  private generateRefreshToken(user: any) {
    // For simplicity, we just generate a long-lived JWT. In production, store this in DB.
    return jwt.sign(
      { userId: user.id },
      settings.authSecret,
      { expiresIn: '7d' }
    );
  }
}
