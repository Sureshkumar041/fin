import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/auth';
import { AppShell } from '@/components/layout/app-shell';

// Shared layout for the logged-in area: /dashboard, /expenses, /categories.
// "(app)" is a route group, so it does not appear in the URL.
// RequireAuth sends logged-out visitors to /login.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
