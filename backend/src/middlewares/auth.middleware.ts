import type { RequestHandler } from 'express';
import { AUTH_COOKIE, clearAuthCookie } from '../utils/auth-cookie';
import { HttpError } from '../utils/http-error';
import { verifyToken } from '../utils/jwt';

// Put in front of any route that needs a logged-in user.
// On success, req.user.id is available to the controller.
export const requireAuth: RequestHandler = (req, res, next) => {
  const token: string | undefined = req.cookies?.[AUTH_COOKIE];
  if (!token) {
    throw new HttpError(401, 'Not authenticated');
  }

  try {
    const { userId } = verifyToken(token);
    req.user = { id: userId };
  } catch {
    // Remove the bad/expired cookie so the browser stops sending it.
    clearAuthCookie(res);
    throw new HttpError(401, 'Session is invalid or has expired, please log in again');
  }

  next();
};
