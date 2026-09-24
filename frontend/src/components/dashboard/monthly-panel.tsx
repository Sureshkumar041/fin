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
  const hasData = months.some((m) => m.totalExpense > 0);

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
            <ColumnChart
              ariaLabel="Total spending per month for the last 12 months"
              formatValue={formatMoney}
              formatTick={formatMoneyCompact}
              data={months.map((m) => ({
                key: m.month,
                label: formatMonth(m.month),
                longLabel: formatMonth(m.month, 'long'),
                value: m.totalExpense,
                detail: plural(m.expenseCount),
              }))}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...months].reverse().map((m) => (
                  <TableRow key={m.month}>
                    <TableCell>{formatMonth(m.month, 'long')}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{m.expenseCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(m.totalExpense)}</TableCell>
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
