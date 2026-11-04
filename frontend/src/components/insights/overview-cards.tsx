import { StatTile } from '@/components/dashboard/stat-tile';
import { CreditCardIcon, UsersIcon, WalletIcon } from '@/components/icons';
import { formatMoney, formatMonth } from '@/lib/format';
import type { InsightMonthTotals } from '@/types';

// The month's three totals, from overview.current (the same as the dashboard).
// Your spending and total paid differ only through split expenses; the
// helper lines say which is which.
export function OverviewCards({ totals }: { totals?: InsightMonthTotals }) {
  const month = totals && formatMonth(totals.month, 'long');
  return (
    // Three across from md: at 640–767px large amounts don't fit three columns.
    <div className="grid gap-4 md:grid-cols-3">
      <StatTile
        label="Your spending"
        value={totals && formatMoney(totals.totalExpense)}
        footnote={`Your own share of expenses in ${month}`}
        loading={!totals}
        accent="lime"
        icon={<WalletIcon />}
      />
      <StatTile
        label="Total paid"
        value={totals && formatMoney(totals.totalPaid)}
        footnote={`Full bill amounts you paid in ${month}, incl. others’ shares`}
        loading={!totals}
        accent="amber"
        icon={<CreditCardIcon />}
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
        accent="pink"
        icon={<UsersIcon />}
      />
    </div>
  );
}
