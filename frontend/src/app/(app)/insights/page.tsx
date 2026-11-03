import type { Metadata } from 'next';
import { InsightsView } from '@/components/insights/insights-view';
import { PageHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'Insights' };

// Like the dashboard: a server component for metadata, with a client view
// that loads the data (the auth cookie lives in the browser).
export default function InsightsPage() {
  return (
    <>
      <PageHeader title="Insights" description="How your spending compares with last month, and where it goes." />
      <InsightsView />
    </>
  );
}
