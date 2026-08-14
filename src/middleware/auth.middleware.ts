import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../core/security';
import { loadSettings } from '../config/config';
import { JwtPayload } from '../core/types';

const settings = loadSettings();

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decodedPayload = verifyAccessToken(token, settings.jwtSecret);
      req.user = decodedPayload;
      next();
    } catch (error: any) {
      return res.status(403).json({ error: error.message || 'Invalid or expired token.' });
    }
  } else {
    res.status(401).json({ error: 'Authorization header missing or invalid.' });
  }
};

export const optionalAuthJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decodedPayload = verifyAccessToken(token, settings.jwtSecret);
      req.user = decodedPayload;
    } catch (error: any) {
      // Ignore expired or invalid access token errors during logout
    }
  }
  next();
};

