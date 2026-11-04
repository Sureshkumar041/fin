import type { ReactNode } from 'react';
import { GuestOnly } from '@/components/auth';
import { AuthBrandPanel } from '@/components/auth/auth-brand-panel';
import { ThemeToggle } from '@/components/theme';

// Shared layout for /login and /register, no app navigation.
// Desktop (lg+): brand panel on the left, the form on the right.
// Below lg: a compact gradient header with the form card overlapping it.
// "(auth)" is a route group, so it does not appear in the URL.
// GuestOnly sends users who are already logged in to /dashboard.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate flex flex-1 flex-col lg:min-h-dvh lg:flex-row">
      <AuthBrandPanel />

      <div className="relative flex flex-1 justify-center px-4 pb-12 sm:px-6 lg:items-center lg:px-10 lg:py-12">
        {/* Decorative: soft glows and a faint dot grid behind the form (the card is opaque). */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <span className="absolute -top-32 -right-24 size-[28rem] rounded-full bg-accent-cyan/10 blur-3xl" />
          <span className="absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-accent-violet/10 blur-3xl" />
          <span className="absolute inset-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        </div>
        <div className="relative -mt-12 w-full max-w-md lg:mt-0">
          <GuestOnly>{children}</GuestOnly>
        </div>
      </div>

      {/* On a solid chip so the icon reads on the gradient header too. */}
      <div className="absolute top-4 right-4 z-10 rounded-xl bg-card shadow-card">
        <ThemeToggle />
      </div>
    </main>
  );
}
