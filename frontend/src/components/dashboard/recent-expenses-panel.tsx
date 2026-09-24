import Link from 'next/link';
import { EmptyState, ErrorState, Panel, Skeleton } from '@/components/ui';
import { formatDate, formatMoney } from '@/lib/format';
import type { ExpenseListResponse } from '@/types';

type RecentExpensesPanelProps = {
  data?: ExpenseListResponse;
  loading: boolean;
  refreshing: boolean;
  error: Error | null;
  onRetry: () => void;
};

export function RecentExpensesPanel({ data, loading, refreshing, error, onRetry }: RecentExpensesPanelProps) {
  const expenses = data?.expenses ?? [];

  return (
    <Panel
      title="Recent expenses"
      actions={
        expenses.length > 0 && (
          <Link href="/expenses" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        )
      }
    >
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : error && !data ? (
        <ErrorState message={error.message} onRetry={onRetry} retrying={refreshing} />
      ) : expenses.length === 0 ? (
        <EmptyState title="No expenses yet" />
      ) : (
        <ul className={refreshing ? 'divide-y divide-border opacity-60' : 'divide-y divide-border'}>
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{e.description ?? e.category.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {e.category.name} · {formatDate(e.expenseDate)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">
                {formatMoney(e.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
