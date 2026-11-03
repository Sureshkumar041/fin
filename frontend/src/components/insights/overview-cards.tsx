import { StatTile } from '@/components/dashboard/stat-tile';
import { formatMoney, formatMonth } from '@/lib/format';
import type { InsightMonthTotals } from '@/types';

// The month's three totals, from overview.current (the same as the dashboard).
// Your spending and total paid differ only through split expenses; the
// helper lines say which is which.
export function OverviewCards({ totals }: { totals?: InsightMonthTotals }) {
  const month = totals && formatMonth(totals.month, 'long');
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatTile
        label="Your spending"
        value={totals && formatMoney(totals.totalExpense)}
        footnote={`Your own share of expenses in ${month}`}
        loading={!totals}
      />
      <StatTile
        label="Total paid"
        value={totals && formatMoney(totals.totalPaid)}
        footnote={`Full bill amounts you paid in ${month}, incl. others’ shares`}
        loading={!totals}
      />
      <StatTile
        label="Others’ share"
        value={totals && formatMoney(totals.othersShare)}
        footnote={
          totals?.othersShare === 0
            ? `Paid by you on behalf of others (settled or not) · none in ${month}`
            : 'Paid by you on behalf of others (settled or not)'
        }
        loading={!totals}
      />
    </div>
  );
}
