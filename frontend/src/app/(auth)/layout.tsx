import type { ReactNode } from 'react';
import { GuestOnly } from '@/components/auth';
import { Brand } from '@/components/layout/brand';
import { ThemeToggle } from '@/components/theme';

// Shared layout for /login and /register: a centered column, no app navigation.
// "(auth)" is a route group, so it does not appear in the URL.
// GuestOnly sends users who are already logged in to /dashboard.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <GuestOnly>{children}</GuestOnly>
      </div>
    </main>
  );
}
