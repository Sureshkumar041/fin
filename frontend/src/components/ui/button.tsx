import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './spinner';

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';
export type Size = 'sm' | 'md' | 'icon';

const variants: Record<Variant, string> = {
  // Lime fill with a subtle gradient and a glow on hover; text on it is always dark.
  primary: 'bg-brand-fill bg-(image:--gradient-brand) font-semibold text-on-brand shadow-sm hover:shadow-brand-glow',
  secondary: 'border border-border bg-surface-2 text-foreground hover:border-input hover:bg-muted',
  ghost: 'text-foreground hover:bg-muted',
  danger: 'bg-danger-solid text-white shadow-sm hover:bg-danger-solid/90',
  // Low-emphasis destructive action, e.g. "Delete" in a table row.
  'danger-ghost': 'text-danger hover:bg-danger-soft',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 rounded-lg px-3 text-sm',
  md: 'h-10 rounded-xl px-4 text-sm',
  icon: 'size-9 rounded-xl', // square, for icon-only buttons (pass aria-label)
};

/** Classes for anything that should look like a button (e.g. a Link). */
export function buttonClassName(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-150',
    'disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = ComponentProps<'button'> & {
  variant?: Variant;
  size?: Size;
  /** Shows a spinner and disables the button, e.g. while a form submits. */
  loading?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonClassName(variant, size, className)}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
