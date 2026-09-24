import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type InputProps = ComponentProps<'input'> & {
  /** Red border + aria-invalid, used by FormField when there is an error. */
  invalid?: boolean;
};

/** Shared look for text inputs and selects. */
export const fieldClassName = (invalid?: boolean, className?: string) =>
  cn(
    'h-10 w-full rounded-lg border bg-card px-3 text-sm text-foreground shadow-xs transition-colors',
    'placeholder:text-muted-foreground',
    'focus-visible:border-ring focus-visible:outline-offset-0',
    'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
    invalid ? 'border-danger focus-visible:outline-danger' : 'border-input',
    className,
  );

export function Input({ invalid, className, ...props }: InputProps) {
  return <input aria-invalid={invalid || undefined} className={fieldClassName(invalid, className)} {...props} />;
}
