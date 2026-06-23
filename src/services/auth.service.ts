import crypto from 'crypto';
import { UserRepository } from '../repositories/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { loadSettings } from '../config/config';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../core/security';
import { UserRole, JwtPayload } from '../core/types';
import { getClient } from '../config/database';

const settings = loadSettings();

export class AuthService {
  private userRepository = new UserRepository();
  private refreshTokenRepository = new RefreshTokenRepository();

  async register(data: { email: string; password: string; companyName: string; firstName: string; lastName: string }) {
    const existingUser = await this.userRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists.');
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const existingOrg = await this.userRepository.findOrganizationByName(data.companyName, client);
      if (existingOrg) {
        throw new Error('An organization with this name already exists. Please request an invitation from the administrator.');
      }

      const org = await this.userRepository.createOrganization(data.companyName, client);
      const passwordHash = await hashPassword(data.password);
      
      // First user becomes ORGANIZATION_OWNER
      const role = UserRole.ORGANIZATION_OWNER;
      const user = await this.userRepository.createUser(org.id, data.email, passwordHash, role, client);
      await this.userRepository.createUserProfile(user.id, data.firstName, data.lastName, client);

      await client.query('COMMIT');

      const tokens = await this.issueTokens({
        userId: user.id,
        organizationId: user.organization_id,
        role: user.role,
        email: user.email,
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          organizationId: user.organization_id,
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findUserByEmail(email);
    if (!user || !user.is_active) {
      throw new Error('Invalid credentials.');
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid credentials.');
    }

    const tokens = await this.issueTokens({
      userId: user.id,
      organizationId: user.organization_id,
      role: user.role,
      email: user.email,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
      },
    };
  }

  async refresh(tokenStr: string) {
    const payload = verifyRefreshToken(tokenStr, settings.refreshTokenSecret);
    const tokenRecord = await this.refreshTokenRepository.findByJti(payload.jti);

    if (!tokenRecord || tokenRecord.revoked || new Date() > new Date(tokenRecord.expires_at)) {
      throw new Error('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findUserById(payload.userId);
    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    // Revoke old refresh token (single use / rotation)
    await this.refreshTokenRepository.revoke(payload.jti);

    const tokens = await this.issueTokens({
      userId: user.id,
      organizationId: user.organization_id,
      role: user.role,
      email: user.email,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(tokenStr: string) {
    try {
      const payload = verifyRefreshToken(tokenStr, settings.refreshTokenSecret);
      await this.refreshTokenRepository.revoke(payload.jti);
    } catch (err) {
      // Ignore if token is already expired/invalid on verify
    }
  }

  private async issueTokens(payload: JwtPayload) {
    const accessToken = generateAccessToken(payload, settings.jwtSecret, settings.accessTokenTtlMinutes);

    const jti = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + settings.refreshTokenTtlDays);

    await this.refreshTokenRepository.create(jti, payload.userId, expiresAt);

    const refreshToken = generateRefreshToken(
      { userId: payload.userId, jti },
      settings.refreshTokenSecret,
      settings.refreshTokenTtlDays
    );

    return { accessToken, refreshToken };
  }
}

