import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

import type { Accent } from '@/lib/category-color';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | Accent;

// Soft tint + the matching text colour (>= 4.5:1 in both themes).
const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  lime: 'bg-accent-lime-soft text-accent-lime-fg',
  cyan: 'bg-accent-cyan-soft text-accent-cyan-fg',
  violet: 'bg-accent-violet-soft text-accent-violet-fg',
  pink: 'bg-accent-pink-soft text-accent-pink-fg',
  amber: 'bg-accent-amber-soft text-accent-amber-fg',
  emerald: 'bg-accent-emerald-soft text-accent-emerald-fg',
  orange: 'bg-accent-orange-soft text-accent-orange-fg',
  sky: 'bg-accent-sky-soft text-accent-sky-fg',
  rose: 'bg-accent-rose-soft text-accent-rose-fg',
  indigo: 'bg-accent-indigo-soft text-accent-indigo-fg',
};

/** Small label, e.g. a category name or a status. Colour never carries meaning alone: keep the text. */
export function Badge({ variant = 'neutral', className, children }: { variant?: BadgeVariant; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', variants[variant], className)}>
      {children}
    </span>
  );
}
