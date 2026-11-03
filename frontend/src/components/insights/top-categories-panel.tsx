import { BarList } from '@/components/charts/bar-list';
import { EmptyState, Panel } from '@/components/ui';
import { formatMoney, formatMonth, formatPercent } from '@/lib/format';
import type { DashboardInsightsResponse } from '@/types';

type TopCategoriesPanelProps = {
  categories: DashboardInsightsResponse['categories'];
  month: DashboardInsightsResponse['month'];
  monthComplete: boolean;
};

// The backend's top three categories of the month, with each one's share of
// your spending (from the API, like the dashboard's category panel).
export function TopCategoriesPanel({ categories, month, monthComplete }: TopCategoriesPanelProps) {
  const monthName = formatMonth(month, 'long');
  const { highest, top } = categories;

  return (
    <Panel
      title="Top categories"
      description={
        highest
          ? `Highest: ${highest.name} · ${formatPercent(highest.percentage)} of your spending in ${monthName}`
          : monthName
      }
    >
      {highest ? (
        <BarList
          formatValue={formatMoney}
          items={top.map((c) => ({ id: c.id, label: c.name, value: c.totalExpense, percentage: c.percentage }))}
        />
      ) : (
        <EmptyState title={monthComplete ? `No spending in ${monthName}` : `No spending in ${monthName} yet`} />
      )}
    </Panel>
  );
}
