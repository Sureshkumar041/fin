import type { Metadata } from 'next';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { PageHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'Dashboard' };

// The page stays a server component (for metadata); the data-loading view is a
// client component because the auth cookie lives in the browser.
export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Your spending at a glance." />
      <DashboardView />
    </>
  );
}
