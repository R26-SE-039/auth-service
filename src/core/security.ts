import bcrypt from 'bcrypt';
import crypto from 'crypto';
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

const ALGORITHM = 'aes-256-cbc';

export function encrypt(text: string, secretKey: string): string {
  // Hash the secretKey to get a 32-byte key
  const key = crypto.createHash('sha256').update(secretKey).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string, secretKey: string): string {
  const key = crypto.createHash('sha256').update(secretKey).digest();
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
