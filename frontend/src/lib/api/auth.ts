import type { LoginInput, RegisterInput, User } from '@/types';
import { apiRequest } from './client';

// Register and login set the auth cookie; logout clears it. Nothing to store here.
export const authApi = {
  register: (input: RegisterInput) =>
    apiRequest<{ user: User }>('/auth/register', { method: 'POST', body: input }).then((r) => r.user),

  login: (input: LoginInput) =>
    apiRequest<{ user: User }>('/auth/login', { method: 'POST', body: input }).then((r) => r.user),

  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),

  /** The logged-in user. Throws ApiError with status 401 if not logged in. */
  me: () => apiRequest<{ user: User }>('/auth/me').then((r) => r.user),
};
