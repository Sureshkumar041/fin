import type { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { clearAuthCookie, setAuthCookie } from '../utils/auth-cookie';
import type { LoginInput, RegisterInput } from '../validators/auth.validator';

export const authController = {
  // req.body has already been validated by validateBody(registerSchema).
  async register(req: Request, res: Response) {
    const { user, token } = await authService.register(req.body as RegisterInput);
    setAuthCookie(res, token);
    res.status(201).json({ user });
  },

  async login(req: Request, res: Response) {
    const { user, token } = await authService.login(req.body as LoginInput);
    setAuthCookie(res, token);
    res.json({ user });
  },

  // JWTs can't be revoked server-side without extra storage; logging out
  // means telling the browser to delete the cookie.
  logout(_req: Request, res: Response) {
    clearAuthCookie(res);
    res.status(204).end();
  },

  // requireAuth guarantees req.user is set.
  async me(req: Request, res: Response) {
    const user = await authService.getCurrentUser(req.user!.id);
    res.json({ user });
  },
};
