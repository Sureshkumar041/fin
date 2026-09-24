'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/lib/api';
import type { LoginInput, RegisterInput, User } from '@/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Holds "who is logged in" for the whole app.
 *
 * The JWT itself lives only in the HTTP-only cookie, which JavaScript can't
 * read. So on page load we ask the backend (GET /auth/me): if the cookie is
 * valid we get the user back, otherwise a 401. Only the *user object* is kept
 * here, in memory; nothing is written to localStorage or sessionStorage.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      })
      .catch(() => {
        // 401 (no/expired cookie) or backend unreachable: treat as logged out.
        if (cancelled) return;
        setUser(null);
        setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const loggedIn = await authApi.login(input); // server sets the cookie
    setUser(loggedIn);
    setStatus('authenticated');
    return loggedIn;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const created = await authApi.register(input); // server sets the cookie
    setUser(created);
    setStatus('authenticated');
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout(); // server clears the cookie
    } finally {
      // Log out locally even if the request failed (e.g. network error).
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
