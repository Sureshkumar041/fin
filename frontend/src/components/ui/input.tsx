import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type InputProps = ComponentProps<'input'> & {
  /** Red border + aria-invalid, used by FormField when there is an error. */
  invalid?: boolean;
};

/** Shared look for text inputs and selects. */
export const fieldClassName = (invalid?: boolean, className?: string) =>
  cn(
    'h-10 w-full rounded-xl border bg-surface-2 px-3 text-sm text-foreground transition-[border-color,background-color] duration-150',
    'placeholder:text-muted-foreground',
    'hover:border-muted-foreground focus-visible:border-ring focus-visible:bg-card focus-visible:outline-offset-0',
    'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
    invalid ? 'border-danger bg-danger-soft/40 focus-visible:outline-danger hover:border-danger' : 'border-input',
    className,
  );

export function Input({ invalid, className, ...props }: InputProps) {
  return <input aria-invalid={invalid || undefined} className={fieldClassName(invalid, className)} {...props} />;
}
