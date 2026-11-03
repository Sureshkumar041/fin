import type { ReactNode } from 'react';
import { Panel, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import type { InsightMoneyChange, InsightTotals, InsightTotalsChange } from '@/types';
import { MoneyChange } from './money-change';

// One row per total. Only your own spending is coloured (up = red): paying
// more on someone else's behalf isn't spending more.
const ROWS = [
  { key: 'totalExpense', label: 'Your spending', noun: 'spending', colored: true },
  { key: 'totalPaid', label: 'Total paid' },
  { key: 'othersShare', label: 'Others’ share' },
] as const;

type ComparisonPanelProps = {
  title: string;
  /** Which periods are compared, e.g. "October 2026 (whole month) → November 2026". */
  description: string;
  /** Column headings for the two periods. */
  previousLabel: string;
  currentLabel: string;
  /** Short previous period for "nothing in Oct (new)". */
  previousShortLabel: string;
  previous: InsightTotals;
  current: InsightTotals;
  /** From the API; never recalculated here. */
  change: InsightTotalsChange;
  /** Shown under the comparison, e.g. that a month in progress is compared with a whole one. */
  note?: ReactNode;
};

export function ComparisonPanel({ title, description, previous, current, change, note, ...labels }: ComparisonPanelProps) {
  return (
    <Panel title={title} description={description}>
      <ComparisonTable
        {...labels}
        rowHeader="Total"
        rows={ROWS.map((row) => ({
          key: row.key,
          label: row.label,
          previous: previous[row.key],
          current: current[row.key],
          change: change[row.key],
          noun: 'noun' in row ? row.noun : undefined,
          colored: 'colored' in row && row.colored,
        }))}
      />
      {note && <p className="mt-3 text-sm text-muted-foreground">{note}</p>}
    </Panel>
  );
}

export type ComparisonRow = {
  key: string;
  label: string;
  /** Values and change from the API; never recalculated here. */
  previous: number;
  current: number;
  change: InsightMoneyChange;
  /** For "no spending in Oct (new)"; without it "nothing in Oct (new)". */
  noun?: string;
  /** Red/green for your own spending (see MoneyChange). */
  colored?: boolean;
};

type ComparisonTableProps = {
  rows: ComparisonRow[];
  /** What the rows are, for screen readers: "Total", "Category". */
  rowHeader: string;
  previousLabel: string;
  currentLabel: string;
  previousShortLabel: string;
};

/** Previous, current and change per row: a table, or one block per row on phones. */
export function ComparisonTable({ rows, rowHeader, previousLabel, currentLabel, previousShortLabel }: ComparisonTableProps) {
  const changeOf = (row: ComparisonRow) => (
    <MoneyChange change={row.change} previousLabel={previousShortLabel} noun={row.noun} colored={row.colored} />
  );
  return (
    <>
      {/* Phones: one block per row; four table columns are too narrow there.
          The periods are shown once above the blocks, in the same two columns
          as the values; each value keeps its period as screen-reader text. */}
      <div
        aria-hidden
        className="mb-3 grid grid-cols-2 gap-x-4 border-b border-border pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:hidden"
      >
        <span>{previousLabel}</span>
        <span>{currentLabel}</span>
      </div>
      <ul className="divide-y divide-border sm:hidden">
        {rows.map((row) => (
          <li key={row.key} className="py-3 first:pt-0 last:pb-0">
            <p className="text-sm font-medium text-foreground">{row.label}</p>
            <dl className="mt-1 grid grid-cols-2 gap-x-4 text-sm">
              <div>
                <dt className="sr-only">{previousLabel}</dt>
                <dd className="tabular-nums text-muted-foreground">{formatMoney(row.previous)}</dd>
              </div>
              <div>
                <dt className="sr-only">{currentLabel}</dt>
                <dd className="tabular-nums text-foreground">{formatMoney(row.current)}</dd>
              </div>
            </dl>
            <p className="mt-1 text-sm tabular-nums">{changeOf(row)}</p>
          </li>
        ))}
      </ul>
      <Table containerClassName="hidden sm:block">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>
              <span className="sr-only">{rowHeader}</span>
            </TableHead>
            <TableHead className="text-right">{previousLabel}</TableHead>
            <TableHead className="text-right">{currentLabel}</TableHead>
            <TableHead className="text-right">Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              {/* A row header, styled like the other cells (TableHead is for column headings). */}
              <th scope="row" className="py-3 pr-3 text-left font-normal">
                {row.label}
              </th>
              <TableCell className="text-right tabular-nums text-muted-foreground">{formatMoney(row.previous)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatMoney(row.current)}</TableCell>
              <TableCell className="text-right tabular-nums">{changeOf(row)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
