import { BarList, type BarListItem } from '@/components/charts/bar-list';
import { EmptyState, ErrorState, Panel, Skeleton } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import type { CategoryTotalsResponse } from '@/types';

// Show the biggest categories; fold the rest into one "Other" row.
const MAX_ROWS = 6;

function toItems(data: CategoryTotalsResponse): BarListItem[] {
  const spent = data.categories.filter((c) => c.totalExpense > 0); // already sorted, highest first
  const items: BarListItem[] = spent.slice(0, MAX_ROWS).map((c) => ({
    id: c.id,
    label: c.name,
    value: c.totalExpense,
    percentage: c.percentage,
  }));
  const rest = spent.slice(MAX_ROWS);
  if (rest.length > 0) {
    items.push({
      id: 'other',
      label: `Other (${rest.length})`,
      value: rest.reduce((sum, c) => sum + c.totalExpense, 0),
      percentage: rest.reduce((sum, c) => sum + c.percentage, 0),
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
      description={data && data.totalExpense > 0 ? `This month · ${formatMoney(data.totalExpense)}` : 'This month'}
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
