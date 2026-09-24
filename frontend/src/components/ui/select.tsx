import type { ComponentProps } from 'react';
import { fieldClassName } from './input';

type SelectProps = ComponentProps<'select'> & { invalid?: boolean };

// Native <select>, styled like Input. Native keeps keyboard and mobile pickers working.
export function Select({ invalid, className, children, ...props }: SelectProps) {
  return (
    <select aria-invalid={invalid || undefined} className={fieldClassName(invalid, className)} {...props}>
      {children}
    </select>
  );
}
