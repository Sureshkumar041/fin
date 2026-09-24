import type { CookieOptions, Response } from 'express';
import { env } from '../config/env';

export const AUTH_COOKIE = 'access_token';

const sameSite: any = env.sameSite;

const cookieOptions: CookieOptions = {
  httpOnly: true, // JavaScript in the browser cannot read it (protects against XSS token theft)
  secure: env.isProduction, // HTTPS only in production; plain http is allowed on localhost
  sameSite: sameSite, // not sent on cross-site POSTs (basic CSRF protection)
  path: '/',
};

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE, token, {
    ...cookieOptions,
    maxAge: env.jwt.expiresInDays * 24 * 60 * 60 * 1000, // ms, matches the JWT expiry
  });
}

// Must use the same options as setAuthCookie or the browser won't remove it.
export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, cookieOptions);
}
