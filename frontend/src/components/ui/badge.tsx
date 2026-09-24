import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const variants: Record<Variant, string> = {
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

/** Small label, e.g. a category name or a status. Colour never carries meaning alone: keep the text. */
export function Badge({ variant = 'neutral', className, children }: { variant?: Variant; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', variants[variant], className)}>
      {children}
    </span>
  );
}
