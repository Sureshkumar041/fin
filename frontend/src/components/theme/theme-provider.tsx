'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

// Keep in sync with theme-script.ts.
const STORAGE_KEY = 'theme';
const CHANGE_EVENT = 'theme-preference-change';
const DARK_QUERY = '(prefers-color-scheme: dark)';

type ThemeContextValue = {
  /** What the user picked. */
  theme: ThemePreference;
  /** What is actually shown ('system' resolved to light or dark). */
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ---- stored preference (localStorage) as an external store ----
function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}
function subscribePreference(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange); // other tabs
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

// ---- OS light/dark setting as an external store ----
function subscribeSystem(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
const readSystemDark = () => window.matchMedia(DARK_QUERY).matches;

/**
 * Light / dark / system theme. The choice is a per-device display preference
 * kept in localStorage (it's not sensitive, unlike the auth token, which
 * stays in its HTTP-only cookie). The .dark class on <html> switches every
 * token in globals.css at once.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Server snapshots ('system', light) keep hydration consistent; the browser
  // values take over right after, and the inline script has already painted
  // the correct colours.
  const theme = useSyncExternalStore(subscribePreference, readPreference, () => 'system' as const);
  const systemDark = useSyncExternalStore(subscribeSystem, readSystemDark, () => false);
  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const setTheme = useCallback((next: ThemePreference) => {
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage blocked (e.g. some private modes): nothing to persist.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
