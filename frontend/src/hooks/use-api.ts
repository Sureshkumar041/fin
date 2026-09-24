'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth';
import { ApiError } from '@/lib/api';

type ApiState<T> = {
  data: T | undefined;
  error: ApiError | Error | null;
  /** True until the first response (success or error) arrives. */
  loading: boolean;
  /** True while new data loads and older data is still on screen. */
  refreshing: boolean;
  reload: () => void;
};

/**
 * Runs an API call and tracks loading/error state. It re-runs when any value
 * in `deps` changes (e.g. filters) or when reload() is called.
 *
 *   const summary = useApi(() => dashboardApi.summary());
 *   const list = useApi(() => expensesApi.list(filters), [filters.page, filters.search]);
 *
 * Previous data stays available while the next request runs, so lists don't
 * flash empty between pages. If the session has expired (401), the user is
 * logged out, and RequireAuth sends them to /login.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []): ApiState<T> {
  const { logout } = useAuth();
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Which request the current data/error belongs to. Comparing it with the
  // latest request key gives loading/refreshing without extra state updates.
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const requestKey = JSON.stringify([attempt, ...deps]);

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError(null);
        setSettledKey(requestKey);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.code === 'UNAUTHENTICATED') {
          void logout();
          return;
        }
        setError(err instanceof Error ? err : new Error('Something went wrong'));
        setSettledKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
    // fetcher is an inline arrow; re-run only when the request key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, logout]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return {
    data,
    error,
    loading: settledKey === null,
    refreshing: settledKey !== null && settledKey !== requestKey,
    reload,
  };
}
