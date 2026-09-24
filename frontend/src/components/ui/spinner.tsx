import { cn } from '@/lib/cn';

/** Uses the current text colour, so it matches whatever it sits in. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent', className)}
    />
  );
}
