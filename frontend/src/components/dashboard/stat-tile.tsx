import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui';
import { ACCENT_CLASSES, type Accent } from '@/lib/category-color';
import { cn } from '@/lib/cn';

type StatTileProps = {
  label: string;
  value?: string;
  /** Small line under the value: context or a change vs last month. */
  footnote?: ReactNode;
  loading?: boolean;
  /** Colour identity: a small gradient chip with `icon` in it. Numbers stay in --foreground. */
  accent?: Accent;
  icon?: ReactNode;
};

export function StatTile({ label, value, footnote, loading, accent, icon }: StatTileProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        {accent && icon && (
          <span
            aria-hidden
            className={cn('-mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl text-on-brand [&>svg]:size-4.5', ACCENT_CLASSES[accent].gradient)}
          >
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-2 h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-24" />
        </>
      ) : (
        <>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-2xl xl:text-3xl">{value}</p>
          {footnote && <div className="mt-1 text-sm text-muted-foreground">{footnote}</div>}
        </>
      )}
    </div>
  );
}
