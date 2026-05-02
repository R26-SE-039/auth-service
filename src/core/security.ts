import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface TokenPayload {
  sub: string;
  exp: number;
  iat: number;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(8).toString('hex'); // 16 chars hex
  const iterations = 120000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  return `pbkdf2_sha256$${iterations}$${salt}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  try {
    const [algorithm, iterationsStr, salt, hashHex] = passwordHash.split('$');
    if (algorithm !== 'pbkdf2_sha256') return false;
    const iterations = parseInt(iterationsStr, 10);
    const hash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
    return crypto.timingSafeEqual(Buffer.from(hash.toString('hex')), Buffer.from(hashHex));
  } catch (error) {
    return false;
  }
}

export function createAccessToken(subject: string, secret: string, ttlMinutes: number): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: subject,
    iat: now,
    exp: now + (ttlMinutes * 60),
  };
  return jwt.sign(payload, secret, { algorithm: 'HS256' });
}

export function decodeAccessToken(token: string, secret: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any;
    if (!decoded.sub) throw new Error("Invalid token subject");
    return {
      sub: decoded.sub,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error("Token expired");
    }
    throw new Error("Invalid token signature");
  }
}
