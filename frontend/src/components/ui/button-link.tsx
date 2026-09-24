import Link from 'next/link';
import type { ComponentProps } from 'react';
import { buttonClassName, type Size, type Variant } from './button';

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

/** A navigation link styled as a button (a <button> inside an <a> is invalid HTML). */
export function ButtonLink({ variant = 'primary', size = 'md', className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClassName(variant, size, className)} {...props} />;
}
