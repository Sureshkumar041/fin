import { BarList, type BarListItem } from '@/components/charts/bar-list';
import { EmptyState, ErrorState, Panel, Skeleton } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { fromPaise, toPaise } from '@/lib/split';
import type { CategoryTotalsResponse } from '@/types';

// Show the biggest categories; fold the rest into one "Other" row.
const MAX_ROWS = 6;

// "₹1,200.00 paid" when you paid more than your own spending (split expenses).
const paidDetail = (spent: number, paid: number) =>
  toPaise(paid) !== toPaise(spent) ? `${formatMoney(paid)} paid` : undefined;

const sumPaise = (values: number[]) => fromPaise(values.reduce((sum, v) => sum + toPaise(v), 0));

function toItems(data: CategoryTotalsResponse): BarListItem[] {
  const spent = data.categories.filter((c) => c.totalExpense > 0); // already sorted, highest first
  const items: BarListItem[] = spent.slice(0, MAX_ROWS).map((c) => ({
    id: c.id,
    label: c.name,
    value: c.totalExpense,
    // From the API: the share of your spending (not of total paid).
    percentage: c.percentage,
    detail: paidDetail(c.totalExpense, c.totalPaid),
  }));
  const rest = spent.slice(MAX_ROWS);
  if (rest.length > 0) {
    const restSpent = sumPaise(rest.map((c) => c.totalExpense));
    items.push({
      id: 'other',
      label: `Other (${rest.length})`,
      value: restSpent,
      percentage: rest.reduce((sum, c) => sum + c.percentage, 0),
      detail: paidDetail(restSpent, sumPaise(rest.map((c) => c.totalPaid))),
      muted: true,
    });
  }
  return items;
}

type CategoryPanelProps = {
  data?: CategoryTotalsResponse;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  onRetry: () => void;
};

export function CategoryPanel({ data, loading, refreshing, error, onRetry }: CategoryPanelProps) {
  const items = data ? toItems(data) : [];

  return (
    <Panel
      title="Spending by category"
      description={
        data && data.totalExpense > 0
          ? `This month · ${formatMoney(data.totalExpense)}${paidDetail(data.totalExpense, data.totalPaid) ? ` (${formatMoney(data.totalPaid)} paid)` : ''}`
          : 'This month'
      }
    >
      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : error && !data ? (
        <ErrorState message={error.message} onRetry={onRetry} retrying={refreshing} />
      ) : items.length === 0 ? (
        <EmptyState title="No spending this month yet" description="Your top categories will appear here." />
      ) : (
        <div className={refreshing ? 'opacity-60' : undefined}>
          <BarList items={items} formatValue={formatMoney} />
        </div>
      )}
    </Panel>
  );
}
