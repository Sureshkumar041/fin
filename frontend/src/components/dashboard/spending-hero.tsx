import { Sparkline } from '@/components/charts/sparkline';
import { formatMoney, formatMonth } from '@/lib/format';
import type { MonthlyTotal } from '@/types';
import { MonthChange } from './month-change';

type SpendingHeroProps = {
  /** e.g. "Spent in November"; from the summary. */
  label: string;
  /** This month's own spending, from the summary. */
  amount?: number;
  /** The monthly totals already loaded for the chart (no extra request). */
  months: MonthlyTotal[];
  loading: boolean;
};

// Months in the sparkline: recent ones only, so it reads as a trend.
const SPARK_MONTHS = 6;

/**
 * "Spent this month" on the hero gradient. All text on the gradient is the
 * dark --on-brand colour (>= 10.2:1 at every point, both themes); the
 * change vs last month sits on a solid chip so its red/green stays readable.
 */
export function SpendingHero({ label, amount, months, loading }: SpendingHeroProps) {
  const [previous, current] = months.slice(-2);
  const recent = months.slice(-SPARK_MONTHS);

  return (
    <section
      aria-label={label}
      className="relative overflow-hidden rounded-2xl bg-brand-fill bg-(image:--gradient-hero) p-6 text-on-brand shadow-card sm:p-7"
    >
      {/* Decorative soft circles for depth. */}
      <span aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-brand-fill/40 blur-2xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{label}</p>
          {loading ? (
            <>
              <span aria-hidden className="mt-2 block h-12 w-56 animate-pulse rounded-lg bg-on-brand/10" />
              <span aria-hidden className="mt-3 block h-7 w-44 animate-pulse rounded-full bg-on-brand/10" />
            </>
          ) : (
            <>
              <p className="mt-1 text-4xl font-bold tracking-tight break-all sm:text-5xl">{amount !== undefined && formatMoney(amount)}</p>
              <p className="mt-3 inline-flex flex-wrap items-center rounded-full bg-card px-3 py-1 text-sm text-muted-foreground">
                {current && previous ? <MonthChange current={current} previous={previous} /> : 'This month'}
              </p>
            </>
          )}
        </div>
        {recent.length >= 2 && (
          <div className="flex flex-col items-end gap-1">
            <Sparkline values={recent.map((m) => m.totalExpense)} width={150} height={48} />
            <p aria-hidden className="text-xs font-medium">
              {formatMonth(recent[0]!.month)} – {formatMonth(recent[recent.length - 1]!.month)}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
