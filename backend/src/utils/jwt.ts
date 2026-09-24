import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// The token carries only the user id (the standard "sub" claim). Anything
// else about the user is loaded from the database when needed.
export function signToken(userId: string): string {
  return jwt.sign({}, env.jwt.secret, {
    subject: userId,
    expiresIn: env.jwt.expiresInDays * 24 * 60 * 60, // seconds
    algorithm: 'HS256',
  });
}

// Throws if the token is malformed, tampered with, or expired.
export function verifyToken(token: string): { userId: string } {
  // Pin the algorithm so a token signed any other way is rejected.
  const payload = jwt.verify(token, env.jwt.secret, { algorithms: ['HS256'] });
  if (typeof payload === 'string' || !payload.sub) {
    throw new Error('Invalid token payload');
  }
  return { userId: payload.sub };
}
