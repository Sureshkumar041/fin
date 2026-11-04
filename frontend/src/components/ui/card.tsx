import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/** Plain surface. For a titled section use Panel. */
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-card', className)}
      {...props}
    />
  );
}
