'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { ExpenseFilters } from '@/types';

export const PAGE_SIZE = 10;

export type FilterValues = Required<Pick<ExpenseFilters, 'categoryId' | 'from' | 'to' | 'search'>>;

/**
 * Filters and page number live in the URL (?categoryId=...&page=2), so a
 * filtered view survives reloads, can be bookmarked, and works with Back.
 */
export function useExpenseFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters: FilterValues = {
    categoryId: params.get('categoryId') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    search: params.get('search') ?? '',
  };
  const page = Math.max(1, Number(params.get('page')) || 1);

  const update = useCallback(
    (changes: Partial<FilterValues & { page: number }>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === '' || value === undefined || (key === 'page' && value === 1)) next.delete(key);
        else next.set(key, String(value));
      }
      // Any filter change starts again from page 1.
      if (!('page' in changes)) next.delete('page');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const query: ExpenseFilters = useMemo(
    () => ({ ...filters, page, limit: PAGE_SIZE }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params],
  );

  const hasFilters = Boolean(filters.categoryId || filters.from || filters.to || filters.search);

  return {
    filters,
    page,
    query,
    hasFilters,
    setFilter: update as (changes: Partial<FilterValues>) => void,
    setPage: (p: number) => update({ page: p }),
    clearFilters: () => update({ categoryId: '', from: '', to: '', search: '' }),
  };
}
