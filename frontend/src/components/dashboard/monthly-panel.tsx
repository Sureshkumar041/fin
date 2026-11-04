'use client';

import { useState } from 'react';
import { ColumnChart } from '@/components/charts/column-chart';
import {
  Button,
  EmptyState,
  ErrorState,
  Panel,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { formatMoney, formatMoneyCompact, formatMonth } from '@/lib/format';
import { toPaise } from '@/lib/split';
import { cn } from '@/lib/cn';
import type { MonthlyTotal, MonthlyTotalsResponse } from '@/types';

type MonthlyPanelProps = {
  data?: MonthlyTotalsResponse;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  onRetry: () => void;
};

const plural = (n: number) => `${n} expense${n === 1 ? '' : 's'}`;

// Display only: the request always covers 12 months. "12 months" skips empty
// months at the start (a new account isn't a wall of zeros) but always shows
// at least 6; "6 months" shows the latest 6.
const MIN_MONTHS = 6;
const hasAmount = (m: MonthlyTotal) => m.totalExpense > 0 || m.totalPaid > 0;
function visibleMonths(months: MonthlyTotal[], range: 6 | 12) {
  const first = months.findIndex(hasAmount);
  const start = range === 6 || first < 0 ? months.length - MIN_MONTHS : Math.min(first, months.length - MIN_MONTHS);
  return months.slice(Math.max(0, start));
}

export function MonthlyPanel({ data, loading, refreshing, error, onRetry }: MonthlyPanelProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [range, setRange] = useState<6 | 12>(12);
  const all = data?.months ?? [];
  // A month can have money paid but no own spending (a bill paid only for others).
  const hasData = all.some(hasAmount);
  const months = visibleMonths(all, range);
  // Offer the toggle only when the two ranges differ.
  const canToggle = visibleMonths(all, 12).length > MIN_MONTHS;
  const first = months[0];
  const last = months[months.length - 1];
  const period = first && last ? `${formatMonth(first.month, 'long')} – ${formatMonth(last.month, 'long')}` : 'Last 12 months';
  // Show "total paid" only when it differs from your spending in some month (i.e. there are splits).
  const showPaid = months.some((m) => toPaise(m.totalPaid) !== toPaise(m.totalExpense));

  return (
    <Panel
      title="Monthly spending"
      description={data ? period : 'Last 12 months'}
      actions={
        hasData && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canToggle && (
              <div role="group" aria-label="Months shown" className="flex rounded-xl border border-border bg-surface-2 p-0.5">
                {([6, 12] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={range === r}
                    onClick={() => setRange(r)}
                    className={cn(
                      'h-7 rounded-lg px-2.5 text-xs font-medium transition-colors duration-150',
                      range === r ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {r} months
                  </button>
                ))}
              </div>
            )}
            {/* The table view is the accessible twin of the chart. */}
            <Button variant="ghost" size="sm" onClick={() => setView(view === 'chart' ? 'table' : 'chart')}>
              {view === 'chart' ? 'Show table' : 'Show chart'}
            </Button>
          </div>
        )
      }
    >
      {loading ? (
        <Skeleton className="h-60 w-full" />
      ) : error && !data ? (
        <ErrorState message={error.message} onRetry={onRetry} retrying={refreshing} />
      ) : !hasData ? (
        <EmptyState title="No spending in the last 12 months" description="Monthly totals will show up here once you add expenses." />
      ) : (
        <div className={refreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          {view === 'chart' ? (
            <>
              {showPaid && (
                <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ background: 'var(--chart-series)' }} />
                    Your spending
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="inline-block size-2.5 rounded-sm border"
                      style={{ borderColor: 'var(--chart-paid)', background: 'color-mix(in srgb, var(--chart-paid) 35%, transparent)' }}
                    />
                    Total paid (incl. others’ shares)
                  </li>
                </ul>
              )}
              <ColumnChart
                ariaLabel={
                  showPaid
                    ? `Your spending and total paid per month, ${period}`
                    : `Total spending per month, ${period}`
                }
                formatValue={formatMoney}
                formatTick={formatMoneyCompact}
                valueLabel="your spending"
                backgroundLabel="total paid"
                data={months.map((m) => ({
                  key: m.month,
                  label: formatMonth(m.month),
                  longLabel: formatMonth(m.month, 'long'),
                  value: m.totalExpense,
                  detail: plural(m.expenseCount),
                  ...(showPaid ? { background: m.totalPaid } : {}),
                }))}
              />
            </>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">{showPaid ? 'Your spending' : 'Total'}</TableHead>
                  {showPaid && <TableHead className="text-right">Total paid</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...months].reverse().map((m) => (
                  <TableRow key={m.month}>
                    <TableCell>{formatMonth(m.month, 'long')}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{m.expenseCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(m.totalExpense)}</TableCell>
                    {showPaid && (
                      <TableCell className="text-right tabular-nums text-muted-foreground">{formatMoney(m.totalPaid)}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </Panel>
  );
}
