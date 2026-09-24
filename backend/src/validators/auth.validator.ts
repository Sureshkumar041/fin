import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Invalid email address').max(255));

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    // bcrypt only uses the first 72 bytes; reject longer so nothing is silently ignored.
    .refine((p) => Buffer.byteLength(p, 'utf8') <= 72, 'Password is too long'),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
