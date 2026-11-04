'use client';

import { ReceiptIcon, WalletIcon } from '@/components/icons';
import { ButtonLink, EmptyState, ErrorState, Panel } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { dashboardApi, expensesApi } from '@/lib/api';
import { formatMoney, formatMonth, monthStartIso, todayIso } from '@/lib/format';
import { toPaise } from '@/lib/split';
import { CategoryPanel } from './category-panel';
import { MonthlyPanel } from './monthly-panel';
import { RecentExpensesPanel } from './recent-expenses-panel';
import { SharedExpensesCard } from './shared-expenses-card';
import { SpendingHero } from './spending-hero';
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

  if (summary.error && !s) {
    return (
      <Panel title="Summary">
        <ErrorState message={summary.error.message} onRetry={summary.reload} retrying={summary.refreshing} />
      </Panel>
    );
  }

  // Brand-new user: one friendly prompt instead of three empty charts.
  const isEmpty = s !== undefined && s.expenseCount === 0;
  // Split tiles only once there is something split: for personal-only data
  // "total paid" equals your spending and nothing is owed.
  const hasSplitAmounts =
    s !== undefined && (toPaise(s.totalPaid) !== toPaise(s.totalExpense) || s.owedToYou > 0 || s.settledToYou > 0);

  return (
    <div className="flex flex-col gap-4">
      <SpendingHero
        label={s ? `Spent in ${formatMonth(s.currentMonth.month, 'long')}` : 'This month'}
        amount={s?.currentMonth.totalExpense}
        months={months}
        loading={summary.loading}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* totalExpense is your own spending: your share of split expenses, not what you paid for others. */}
        <StatTile
          label="Your spending"
          value={s && formatMoney(s.totalExpense)}
          footnote="All time"
          loading={summary.loading}
          accent="lime"
          icon={<WalletIcon />}
        />
        <StatTile
          label="Transactions"
          value={s && s.expenseCount.toLocaleString()}
          footnote={s && `${s.currentMonth.expenseCount.toLocaleString()} this month`}
          loading={summary.loading}
          accent="violet"
          icon={<ReceiptIcon />}
        />
      </div>

      {s && hasSplitAmounts && <SharedExpensesCard summary={s} />}

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
