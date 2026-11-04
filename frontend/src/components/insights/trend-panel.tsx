'use client';

import { useState, type ReactNode } from 'react';
import { ColumnChart, type ColumnDatum } from '@/components/charts/column-chart';
import { Button, EmptyState, Panel, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { formatMoney, formatMoneyCompact } from '@/lib/format';

export type TrendTableColumn = {
  header: string;
  /** Secondary columns (counts, total paid) are muted, like the dashboard's monthly table. */
  muted?: boolean;
};

export type TrendTableRow = {
  key: string;
  /** First cell: what the row is (a day, week or weekday). */
  label: string;
  /** One value per column after the first. */
  cells: ReactNode[];
};

type TrendPanelProps = {
  title: string;
  description: string;
  /** False when every period is empty: an empty state replaces the chart. */
  hasData: boolean;
  emptyTitle: string;
  data: ColumnDatum[];
  ariaLabel: string;
  /** Total paid is drawn behind your spending (split expenses), with a legend. */
  showPaid?: boolean;
  minLabelSpacing?: number;
  highlightLast?: boolean;
  /** The table twin of the chart: first column header, then the value columns. */
  rowHeader: string;
  columns: TrendTableColumn[];
  rows: TrendTableRow[];
};

/**
 * A titled chart with a "Show table" toggle, like the dashboard's monthly
 * panel: the table is the accessible twin of the chart.
 */
export function TrendPanel({
  title,
  description,
  hasData,
  emptyTitle,
  data,
  ariaLabel,
  showPaid = false,
  minLabelSpacing,
  highlightLast,
  rowHeader,
  columns,
  rows,
}: TrendPanelProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart');

  return (
    <Panel
      title={title}
      description={description}
      actions={
        hasData && (
          <Button variant="ghost" size="sm" onClick={() => setView(view === 'chart' ? 'table' : 'chart')}>
            {view === 'chart' ? 'Show table' : 'Show chart'}
          </Button>
        )
      }
    >
      {!hasData ? (
        <EmptyState title={emptyTitle} />
      ) : view === 'chart' ? (
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
            ariaLabel={ariaLabel}
            formatValue={formatMoney}
            formatTick={formatMoneyCompact}
            valueLabel="your spending"
            backgroundLabel="total paid"
            minLabelSpacing={minLabelSpacing}
            highlightLast={highlightLast}
            data={data}
          />
        </>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{rowHeader}</TableHead>
              {columns.map((c) => (
                <TableHead key={c.header} className="text-right">
                  {c.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>{row.label}</TableCell>
                {row.cells.map((cell, i) => (
                  <TableCell
                    key={columns[i].header}
                    className={columns[i].muted ? 'text-right tabular-nums text-muted-foreground' : 'text-right tabular-nums'}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
