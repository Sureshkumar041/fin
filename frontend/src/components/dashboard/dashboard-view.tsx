'use client';

import { ButtonLink, EmptyState, ErrorState, Panel } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { dashboardApi, expensesApi } from '@/lib/api';
import { formatMoney, formatMonth, monthStartIso, todayIso } from '@/lib/format';
import { CategoryPanel } from './category-panel';
import { MonthChange } from './month-change';
import { MonthlyPanel } from './monthly-panel';
import { RecentExpensesPanel } from './recent-expenses-panel';
import { StatTile } from './stat-tile';

export function DashboardView() {
  // Four independent requests in parallel. Each section has its own loading
  // and error state, so one failing endpoint doesn't blank the whole page.
  const summary = useApi(() => dashboardApi.summary());
  const monthly = useApi(() => dashboardApi.monthly({ months: 12 }));
  const categories = useApi(() => dashboardApi.categories({ from: monthStartIso(), to: todayIso() }));
  const recent = useApi(() => expensesApi.list({ limit: 5 }));

  const s = summary.data;
  const months = monthly.data?.months ?? [];
  const [previous, current] = months.slice(-2);

  if (summary.error && !s) {
    return (
      <Panel title="Summary">
        <ErrorState message={summary.error.message} onRetry={summary.reload} retrying={summary.refreshing} />
      </Panel>
    );
  }

  // Brand-new user: one friendly prompt instead of three empty charts.
  const isEmpty = s !== undefined && s.expenseCount === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Total expenses" value={s && formatMoney(s.totalExpense)} footnote="All time" loading={summary.loading} />
        <StatTile
          label={s ? `Spent in ${formatMonth(s.currentMonth.month, 'long')}` : 'This month'}
          value={s && formatMoney(s.currentMonth.totalExpense)}
          footnote={current && previous ? <MonthChange current={current} previous={previous} /> : 'This month'}
          loading={summary.loading}
        />
        <StatTile
          label="Transactions"
          value={s && s.expenseCount.toLocaleString()}
          footnote={s && `${s.currentMonth.expenseCount.toLocaleString()} this month`}
          loading={summary.loading}
        />
      </div>

      {isEmpty ? (
        <Panel title="Get started">
          <EmptyState
            title="No expenses yet"
            description="Create a category, then add your first expense. Your charts will appear here."
            action={
              <div className="flex gap-2">
                <ButtonLink href="/categories" variant="secondary" size="sm">
                  Add a category
                </ButtonLink>
                <ButtonLink href="/expenses" size="sm">
                  Add an expense
                </ButtonLink>
              </div>
            }
          />
        </Panel>
      ) : (
        <>
          <MonthlyPanel
            data={monthly.data}
            loading={monthly.loading}
            refreshing={monthly.refreshing}
            error={monthly.error}
            onRetry={monthly.reload}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <CategoryPanel
              data={categories.data}
              loading={categories.loading}
              refreshing={categories.refreshing}
              error={categories.error}
              onRetry={categories.reload}
            />
            <RecentExpensesPanel
              data={recent.data}
              loading={recent.loading}
              refreshing={recent.refreshing}
              error={recent.error}
              onRetry={recent.reload}
            />
          </div>
        </>
      )}
    </div>
  );
}
