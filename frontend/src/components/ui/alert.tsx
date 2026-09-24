import type { ReactNode } from 'react';
import { AlertIcon, CheckIcon } from '@/components/icons';
import { cn } from '@/lib/cn';

type Variant = 'error' | 'warning' | 'success' | 'info';

const variants: Record<Variant, string> = {
  error: 'border-danger/30 bg-danger-soft text-danger',
  warning: 'border-warning/30 bg-warning-soft text-warning',
  success: 'border-success/30 bg-success-soft text-success',
  info: 'border-border bg-muted text-foreground',
};

// For form-level and page-level messages, e.g. "Invalid email or password".
export function Alert({ variant = 'info', children }: { variant?: Variant; children: ReactNode }) {
  const Icon = variant === 'success' ? CheckIcon : AlertIcon;
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm', variants[variant])}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
