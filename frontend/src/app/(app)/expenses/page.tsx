import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ExpensesView } from '@/components/expenses/expenses-view';
import { Skeleton } from '@/components/ui';

export const metadata: Metadata = { title: 'Expenses' };

export default function ExpensesPage() {
  // ExpensesView reads filters from the URL (useSearchParams), which needs a Suspense boundary.
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ExpensesView />
    </Suspense>
  );
}
