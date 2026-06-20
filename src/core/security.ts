import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JwtPayload, RefreshTokenPayload } from './types';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function generateAccessToken(payload: JwtPayload, secret: string, expiresInMinutes: number): string {
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: `${expiresInMinutes}m`,
  });
}

export function generateRefreshToken(payload: RefreshTokenPayload, secret: string, expiresInDays: number): string {
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: `${expiresInDays}d`,
  });
}

export function verifyAccessToken(token: string, secret: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any;
    if (!decoded.userId || !decoded.organizationId || !decoded.role || !decoded.email) {
      throw new Error('Invalid access token payload structure');
    }
    return {
      userId: decoded.userId,
      organizationId: decoded.organizationId,
      role: decoded.role,
      email: decoded.email,
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    }
    throw new Error('Invalid access token signature');
  }
}

export function verifyRefreshToken(token: string, secret: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any;
    if (!decoded.userId || !decoded.jti) {
      throw new Error('Invalid refresh token payload structure');
    }
    return {
      userId: decoded.userId,
      jti: decoded.jti,
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    throw new Error('Invalid refresh token signature');
  }
}
