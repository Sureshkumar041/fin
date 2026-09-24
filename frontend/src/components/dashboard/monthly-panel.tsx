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
import type { MonthlyTotalsResponse } from '@/types';

type MonthlyPanelProps = {
  data?: MonthlyTotalsResponse;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  onRetry: () => void;
};

const plural = (n: number) => `${n} expense${n === 1 ? '' : 's'}`;

export function MonthlyPanel({ data, loading, refreshing, error, onRetry }: MonthlyPanelProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const months = data?.months ?? [];
  // A month can have money paid but no own spending (a bill paid only for others).
  const hasData = months.some((m) => m.totalExpense > 0 || m.totalPaid > 0);
  // Show "total paid" only when it differs from your spending in some month (i.e. there are splits).
  const showPaid = months.some((m) => toPaise(m.totalPaid) !== toPaise(m.totalExpense));

  return (
    <Panel
      title="Monthly spending"
      description={data ? `${formatMonth(data.from, 'long')} – ${formatMonth(data.to, 'long')}` : 'Last 12 months'}
      actions={
        hasData && (
          // The table view is the accessible twin of the chart.
          <Button variant="ghost" size="sm" onClick={() => setView(view === 'chart' ? 'table' : 'chart')}>
            {view === 'chart' ? 'Show table' : 'Show chart'}
          </Button>
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
                      className="inline-block size-2.5 rounded-sm border border-dashed"
                      style={{ borderColor: 'var(--chart-series)', background: 'color-mix(in srgb, var(--chart-series) 18%, transparent)' }}
                    />
                    Total paid (incl. others’ shares)
                  </li>
                </ul>
              )}
              <ColumnChart
                ariaLabel={
                  showPaid
                    ? 'Your spending and total paid per month for the last 12 months'
                    : 'Total spending per month for the last 12 months'
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
