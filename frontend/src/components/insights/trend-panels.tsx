import { formatDate, formatDateRange, formatDayMonth, formatMoney, formatMonth } from '@/lib/format';
import { toPaise } from '@/lib/split';
import type { DashboardInsightsResponse, InsightTotals } from '@/types';
import { TrendPanel, type TrendTableColumn } from './trend-panel';

// Daily, weekly and weekday trends from the API. Labels come straight from
// the API's date strings and weekday numbers; nothing is recalculated.

type Trends = DashboardInsightsResponse['trends'];

const plural = (n: number) => `${n} expense${n === 1 ? '' : 's'}`;
const hasSpending = (rows: InsightTotals[]) => rows.some((r) => r.totalExpense > 0 || r.totalPaid > 0);
// Total paid only differs from your spending through split expenses.
const hasSplits = (rows: InsightTotals[]) => rows.some((r) => toPaise(r.totalPaid) !== toPaise(r.totalExpense));

// The dashboard's monthly table columns: count, your spending, total paid.
const totalsColumns = (showPaid: boolean): TrendTableColumn[] => [
  { header: 'Expenses', muted: true },
  { header: showPaid ? 'Your spending' : 'Total' },
  ...(showPaid ? [{ header: 'Total paid', muted: true }] : []),
];
const totalsCells = (t: InsightTotals, showPaid: boolean) => [
  t.expenseCount,
  formatMoney(t.totalExpense),
  ...(showPaid ? [formatMoney(t.totalPaid)] : []),
];

// "2026-09-07" -> "7" (no Date involved).
const dayOfMonth = (date: string) => String(Number(date.slice(8)));

type DailyTrendPanelProps = {
  daily: Trends['daily'];
  month: DashboardInsightsResponse['month'];
  /** The last day counted so far (samePeriod.current.to). */
  to: string;
  monthComplete: boolean;
};

export function DailyTrendPanel({ daily, month, to, monthComplete }: DailyTrendPanelProps) {
  const monthName = formatMonth(month, 'long');
  const showPaid = hasSplits(daily);
  return (
    <TrendPanel
      title="Daily spending"
      description={monthComplete ? monthName : `${monthName} so far, to ${formatDayMonth(to)}`}
      hasData={hasSpending(daily)}
      emptyTitle={monthComplete ? `No spending in ${monthName}` : `No spending in ${monthName} yet`}
      ariaLabel={
        showPaid ? `Your spending and total paid per day in ${monthName}` : `Your spending per day in ${monthName}`
      }
      showPaid={showPaid}
      // The last bar is the month's last day, not the latest: no emphasis.
      highlightLast={false}
      minLabelSpacing={24}
      data={daily.map((d) => ({
        key: d.date,
        label: dayOfMonth(d.date),
        longLabel: formatDate(d.date),
        value: d.totalExpense,
        detail: plural(d.expenseCount),
        ...(showPaid ? { background: d.totalPaid } : {}),
      }))}
      rowHeader="Day"
      columns={totalsColumns(showPaid)}
      rows={daily.map((d) => ({ key: d.date, label: formatDate(d.date), cells: totalsCells(d, showPaid) }))}
    />
  );
}

export function WeeklyTrendPanel({ weekly }: { weekly: Trends['weekly'] }) {
  const range = formatDateRange(weekly.from, weekly.to);
  const showPaid = hasSplits(weekly.weeks);
  return (
    <TrendPanel
      title="Weekly spending"
      description={`${weekly.weeks.length} complete weeks, Monday to Sunday: ${range}`}
      hasData={hasSpending(weekly.weeks)}
      emptyTitle={`No spending in the ${weekly.weeks.length} weeks to ${formatDate(weekly.to)}`}
      ariaLabel={
        showPaid
          ? `Your spending and total paid per week, ${range}`
          : `Your spending per week, ${range}`
      }
      showPaid={showPaid}
      minLabelSpacing={48}
      data={weekly.weeks.map((w) => ({
        key: w.weekStart,
        label: formatDayMonth(w.weekStart),
        longLabel: formatDateRange(w.weekStart, w.weekEnd),
        value: w.totalExpense,
        detail: plural(w.expenseCount),
        ...(showPaid ? { background: w.totalPaid } : {}),
      }))}
      rowHeader="Week"
      columns={totalsColumns(showPaid)}
      rows={weekly.weeks.map((w) => ({
        key: w.weekStart,
        label: formatDateRange(w.weekStart, w.weekEnd),
        cells: totalsCells(w, showPaid),
      }))}
    />
  );
}

// ISO weekday from the API: 1 = Monday ... 7 = Sunday.
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function WeekdayPanel({ weekly }: { weekly: Trends['weekly'] }) {
  const weeks = weekly.weeks.length;
  const range = formatDateRange(weekly.from, weekly.to);
  return (
    <TrendPanel
      title="By weekday"
      description={`Your spending in an average week, over the ${weeks} weeks ${range}`}
      hasData={hasSpending(weekly.weekdays)}
      emptyTitle={`No spending in the ${weeks} weeks to ${formatDate(weekly.to)}`}
      ariaLabel={`Your spending per weekday in an average week, over the ${weeks} weeks ${range}`}
      // Sunday is the last bar, not the latest: no emphasis.
      highlightLast={false}
      data={weekly.weekdays.map((d) => ({
        key: String(d.weekday),
        label: WEEKDAYS[d.weekday - 1].slice(0, 3),
        longLabel: `${WEEKDAYS[d.weekday - 1]}, average week`,
        value: d.averageExpense,
        detail: `${formatMoney(d.totalExpense)} in ${weeks} weeks`,
      }))}
      rowHeader="Weekday"
      columns={[
        { header: 'Expenses', muted: true },
        { header: 'Average week' },
        { header: `${weeks}-week total`, muted: true },
      ]}
      rows={weekly.weekdays.map((d) => ({
        key: String(d.weekday),
        label: WEEKDAYS[d.weekday - 1],
        cells: [d.expenseCount, formatMoney(d.averageExpense), formatMoney(d.totalExpense)],
      }))}
    />
  );
}
