'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Spinner } from '@/components/ui';
import { useAuth } from './auth-provider';

function FullPageSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
      <Spinner className="size-6" />
    </div>
  );
}

// Only allow redirects to paths inside this app ("/expenses"), never to
// other sites ("//evil.com" or "https://...").
function safeRedirectPath(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
}

/**
 * Wraps logged-in pages. Logged-out visitors are sent to /login?next=<page>
 * so they come back to the same page after logging in.
 *
 * This guard is for user experience. The real protection is the backend:
 * without a valid cookie, every API call returns 401.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Remember whether this session was ever logged in: after an explicit
  // logout we go to plain /login instead of /login?next=...
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (status === 'authenticated') {
      wasAuthenticated.current = true;
    } else if (status === 'unauthenticated') {
      router.replace(
        wasAuthenticated.current ? '/login' : `/login?next=${encodeURIComponent(pathname)}`,
      );
    }
  }, [status, pathname, router]);

  if (status !== 'authenticated') return <FullPageSpinner />;
  return <>{children}</>;
}

function GuestOnlyInner({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get('next');

  // Covers both "already logged in and opened /login" and "just logged in or
  // registered": the forms don't navigate themselves.
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(safeRedirectPath(next));
    }
  }, [status, next, router]);

  if (status !== 'unauthenticated') return <FullPageSpinner />;
  return <>{children}</>;
}

/** Wraps /login and /register: logged-in users are redirected to the app. */
export function GuestOnly({ children }: { children: ReactNode }) {
  // useSearchParams() needs a Suspense boundary on prerendered pages.
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <GuestOnlyInner>{children}</GuestOnlyInner>
    </Suspense>
  );
}
