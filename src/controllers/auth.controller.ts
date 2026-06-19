import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, companyName, firstName, lastName } = req.body;
      if (!email || !password || !companyName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await authService.register({ email, password, companyName, firstName, lastName });
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Missing email or password' });
      }

      const result = await authService.login(email, password);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }

  async refreshToken(req: Request, res: Response) {
    // In a real app, validate refresh token from DB.
    // Here we'll just mock a successful response if token is passed
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    // For now return dummy response
    return res.status(200).json({ message: 'Refresh token endpoint' });
  }

  async logout(req: Request, res: Response) {
    // In a stateless JWT implementation, logout is usually handled client-side by deleting the token.
    // If you store refresh tokens in DB, you would revoke it here.
    return res.status(200).json({ message: 'Logged out successfully' });
  }
}
