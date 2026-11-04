import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type PanelProps = {
  title: string;
  description?: string;
  /** Right side of the header, e.g. a "View all" link or a table toggle. */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** A titled card section. Most page blocks are one of these. */
export function Panel({ title, description, actions, className, children }: PanelProps) {
  return (
    <section
      className={cn('flex min-w-0 flex-col rounded-2xl border border-border bg-card text-card-foreground shadow-card', className)}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 px-5 pt-5 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="flex-1 px-5 pt-4 pb-5 sm:px-6 sm:pb-6">{children}</div>
    </section>
  );
}
