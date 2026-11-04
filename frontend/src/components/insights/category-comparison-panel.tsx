'use client';

import { useState } from 'react';
import { Button, CategoryIcon, EmptyState, Panel } from '@/components/ui';
import { formatDateRange, formatMonth } from '@/lib/format';
import type { DashboardInsightsResponse } from '@/types';
import { ComparisonTable, type ComparisonRow } from './comparison-panel';

type Mode = 'samePeriod' | 'fullMonth';

type CategoryComparisonPanelProps = {
  data: DashboardInsightsResponse;
  monthComplete: boolean;
};

// Each category's spending vs the previous month, in the API's order. While
// the month is in progress the same days are compared by default, with the
// whole month one click away; a complete month has only the one comparison.
export function CategoryComparisonPanel({ data, monthComplete }: CategoryComparisonPanelProps) {
  const [selected, setSelected] = useState<Mode>('samePeriod');
  const mode: Mode = monthComplete ? 'fullMonth' : selected;

  const month = formatMonth(data.month, 'long');
  const previousMonth = formatMonth(data.previousMonth, 'long');
  const { current, previous } = data.samePeriod;
  const labels =
    mode === 'samePeriod'
      ? {
          description: `${formatDateRange(previous.from, previous.to)} → ${formatDateRange(current.from, current.to)}`,
          previousLabel: formatDateRange(previous.from, previous.to),
          currentLabel: formatDateRange(current.from, current.to),
          previousShortLabel: formatDateRange(previous.from, previous.to),
        }
      : {
          description: monthComplete
            ? `${previousMonth} → ${month}`
            : `${previousMonth} (whole month) → ${month} so far`,
          previousLabel: formatMonth(data.previousMonth),
          currentLabel: monthComplete ? formatMonth(data.month) : `${formatMonth(data.month)} so far`,
          previousShortLabel: formatMonth(data.previousMonth),
        };

  const { description, ...columns } = labels;

  const rows: ComparisonRow[] = data.categories.items
    .map((c) => {
      const values =
        mode === 'samePeriod'
          ? { previous: c.samePeriod.previousTotalExpense, current: c.samePeriod.totalExpense, change: c.samePeriod.change }
          : { previous: c.fullMonth.previousTotalExpense, current: c.totalExpense, change: c.fullMonth.change };
      return { key: c.id, label: c.name, noun: 'spending', colored: true, icon: <CategoryIcon category={c} size="sm" />, ...values };
    })
    // A category can have spending in one comparison but none in the other.
    .filter((row) => row.previous !== 0 || row.current !== 0);

  return (
    <Panel title="Categories vs last month" description={description}>
      {/* In the body, not the header: next to the title it squeezes the description on phones. */}
      {!monthComplete && (
        <div role="group" aria-label="Compare" className="mb-4 flex gap-1">
          {(
            [
              ['samePeriod', 'Same days'],
              ['fullMonth', 'Whole month'],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              variant={mode === value ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={mode === value}
              onClick={() => setSelected(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}
      {rows.length > 0 ? (
        <ComparisonTable rows={rows} rowHeader="Category" {...columns} />
      ) : (
        <EmptyState
          title="No category spending to compare"
          description={`Nothing was spent in ${columns.previousLabel} or ${columns.currentLabel}.`}
        />
      )}
    </Panel>
  );
}
