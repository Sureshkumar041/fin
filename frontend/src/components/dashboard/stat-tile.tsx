import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui';

type StatTileProps = {
  label: string;
  value?: string;
  /** Small line under the value: context or a change vs last month. */
  footnote?: ReactNode;
  loading?: boolean;
};

export function StatTile({ label, value, footnote, loading }: StatTileProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      {loading ? (
        <>
          <Skeleton className="mt-2 h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-24" />
        </>
      ) : (
        <>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{value}</p>
          {footnote && <div className="mt-1 text-sm text-muted-foreground">{footnote}</div>}
        </>
      )}
    </div>
  );
}
