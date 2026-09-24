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
      className={cn('flex flex-col rounded-xl border border-border bg-card text-card-foreground shadow-sm', className)}
    >
      <header className="flex items-start justify-between gap-4 px-5 pt-5">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="flex-1 px-5 pt-4 pb-5">{children}</div>
    </section>
  );
}
