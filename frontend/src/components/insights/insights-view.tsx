'use client';

import { MonthlyPanel } from '@/components/dashboard/monthly-panel';
import { ButtonLink, Card, EmptyState, ErrorState, Panel, Skeleton } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { dashboardApi } from '@/lib/api';
import { formatDateRange, formatMonth } from '@/lib/format';
import type { DashboardInsightsResponse, YearMonth } from '@/types';
import { CategoryComparisonPanel } from './category-comparison-panel';
import { ComparisonPanel } from './comparison-panel';
import { ObservationsPanel } from './observations-panel';
import { OverviewCards } from './overview-cards';
import { TopCategoriesPanel } from './top-categories-panel';
import { DailyTrendPanel, WeekdayPanel, WeeklyTrendPanel } from './trend-panels';

// "2026-11" -> "2026-11-30"
function lastDayOf(month: YearMonth) {
  const [y, m] = month.split('-').map(Number);
  return `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
}

export function InsightsView() {
  // The browser's month and today are sent, so periods follow the user's timezone.
  const insights = useApi(() => dashboardApi.insights());
  const data = insights.data;

  if (insights.loading) {
    return (
      <div className="flex flex-col gap-4">
        <OverviewCards />
        <Panel title="Highlights">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </Panel>
        <Panel title="Month vs month">
          <Skeleton className="h-36 w-full" />
        </Panel>
        <Panel title="Same days">
          <Skeleton className="h-36 w-full" />
        </Panel>
        <Panel title="Top categories">
          <Skeleton className="h-36 w-full" />
        </Panel>
        <Panel title="Categories vs last month">
          <Skeleton className="h-36 w-full" />
        </Panel>
        <Panel title="Daily spending">
          <Skeleton className="h-60 w-full" />
        </Panel>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel title="Weekly spending">
            <Skeleton className="h-60 w-full" />
          </Panel>
          <Panel title="By weekday">
            <Skeleton className="h-60 w-full" />
          </Panel>
        </div>
        <Panel title="Monthly spending">
          <Skeleton className="h-60 w-full" />
        </Panel>
      </div>
    );
  }

  if (insights.error && !data) {
    return (
      <Card>
        <ErrorState
          title="Couldn't load your insights"
          message={insights.error.message}
          onRetry={insights.reload}
          retrying={insights.refreshing}
        />
      </Card>
    );
  }

  if (!data) return null;

  // Nothing spent or paid in the last 12 months: one prompt instead of empty panels.
  // A month can have money paid but no own spending (a bill paid only for others).
  const hasHistory = data.trends.monthly.months.some((m) => m.totalExpense > 0 || m.totalPaid > 0);
  if (!hasHistory) {
    return (
      <Card>
        <EmptyState
          title="Nothing to analyse yet"
          description="Insights compare your spending month by month. Add a few expenses to see them here."
          action={
            <ButtonLink href="/expenses" size="sm">
              Add an expense
            </ButtonLink>
          }
        />
      </Card>
    );
  }

  // The month is complete once the same-days period reaches its last day;
  // the same-days and whole-month comparisons are then the same.
  const monthComplete = data.samePeriod.current.to === lastDayOf(data.month);

  return (
    <div className="flex flex-col gap-4">
      <OverviewCards totals={data.overview.current} />
      <ObservationsPanel observations={data.observations} />
      <Comparisons data={data} monthComplete={monthComplete} />
      <TopCategoriesPanel categories={data.categories} month={data.month} monthComplete={monthComplete} />
      <CategoryComparisonPanel data={data} monthComplete={monthComplete} />
      <DailyTrendPanel
        daily={data.trends.daily}
        month={data.month}
        to={data.samePeriod.current.to}
        monthComplete={monthComplete}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WeeklyTrendPanel weekly={data.trends.weekly} />
        <WeekdayPanel weekly={data.trends.weekly} />
      </div>
      {/* The dashboard's panel, unchanged: the 12 months ending at the insights month. */}
      <MonthlyPanel
        data={data.trends.monthly}
        loading={false}
        refreshing={insights.refreshing}
        error={null}
        onRetry={insights.reload}
      />
    </div>
  );
}

function Comparisons({ data, monthComplete }: { data: DashboardInsightsResponse; monthComplete: boolean }) {
  const { overview, samePeriod } = data;
  const month = formatMonth(data.month, 'long');
  const previousMonth = formatMonth(data.previousMonth, 'long');
  const previousDays = formatDateRange(samePeriod.previous.from, samePeriod.previous.to);
  const currentDays = formatDateRange(samePeriod.current.from, samePeriod.current.to);

  return (
    <>
      <ComparisonPanel
        title="Month vs month"
        description={
          monthComplete ? `${previousMonth} → ${month}` : `${previousMonth} (whole month) → ${month} so far`
        }
        previousLabel={formatMonth(data.previousMonth)}
        currentLabel={monthComplete ? formatMonth(data.month) : `${formatMonth(data.month)} so far`}
        previousShortLabel={formatMonth(data.previousMonth)}
        previous={overview.previous}
        current={overview.current}
        change={overview.change}
        note={
          !monthComplete &&
          `${month} is still in progress, so it is compared with all of ${previousMonth}. The same-days comparison below is like for like.`
        }
      />
      {monthComplete ? (
        <p className="text-sm text-muted-foreground">
          {month} is complete, so the same-days comparison equals the month-vs-month comparison above.
        </p>
      ) : (
        <ComparisonPanel
          title="Same days"
          description={`${previousDays} → ${currentDays}`}
          previousLabel={previousDays}
          currentLabel={currentDays}
          previousShortLabel={previousDays}
          previous={samePeriod.previous}
          current={samePeriod.current}
          change={samePeriod.change}
        />
      )}
    </>
  );
}
