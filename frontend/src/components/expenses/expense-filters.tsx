'use client';

import { useEffect, useState } from 'react';
import { Button, FormField, Input, Select } from '@/components/ui';
import type { Category } from '@/types';
import type { FilterValues } from './use-expense-filters';

type ExpenseFiltersProps = {
  filters: FilterValues;
  categories: Category[];
  hasFilters: boolean;
  onChange: (changes: Partial<FilterValues>) => void;
  onClear: () => void;
};

const APPLY_DELAY_MS = 350;

// While a year is being typed, date inputs report values like "0002-08-10".
// Only apply empty values or dates with a realistic year.
const isUsableDate = (value: string) => value === '' || Number(value.slice(0, 4)) >= 1900;

type Draft = Pick<FilterValues, 'search' | 'from' | 'to'>;

// Both dates complete and From after To.
const isInverted = ({ from, to }: Draft) =>
  from !== '' && to !== '' && isUsableDate(from) && isUsableDate(to) && from > to;

/** One row of filters above the list; changes are applied to the URL. */
export function ExpenseFiltersBar({ filters, categories, hasFilters, onChange, onClear }: ExpenseFiltersProps) {
  // Search and dates are edited locally and applied after a short pause, so
  // typing doesn't fire a request per keystroke. Category applies instantly.
  const [draft, setDraft] = useState<Draft>({ search: filters.search, from: filters.from, to: filters.to });

  useEffect(() => {
    const changes: Partial<FilterValues> = {};
    if (draft.search.trim() !== filters.search) changes.search = draft.search.trim();
    // Hold back an inverted range (the field shows an error instead of a failed request).
    if (!isInverted(draft)) {
      if (draft.from !== filters.from && isUsableDate(draft.from)) changes.from = draft.from;
      if (draft.to !== filters.to && isUsableDate(draft.to)) changes.to = draft.to;
    }
    if (Object.keys(changes).length === 0) return;

    const timer = setTimeout(() => onChange(changes), APPLY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, filters.search, filters.from, filters.to, onChange]);

  const rangeInvalid = isInverted(draft);

  function clear() {
    setDraft({ search: '', from: '', to: '' });
    onClear();
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_1fr_1fr_auto] lg:items-start">
      <FormField label="Search" htmlFor="filter-search">
        <Input
          id="filter-search"
          type="search"
          placeholder="Search descriptions"
          value={draft.search}
          onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
        />
      </FormField>
      <FormField label="Category" htmlFor="filter-category">
        <Select
          id="filter-category"
          value={filters.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="From" htmlFor="filter-from" error={rangeInvalid ? 'Must be on or before “To”' : undefined}>
        <Input
          id="filter-from"
          type="date"
          value={draft.from}
          invalid={rangeInvalid}
          onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
        />
      </FormField>
      <FormField label="To" htmlFor="filter-to">
        <Input
          id="filter-to"
          type="date"
          value={draft.to}
          invalid={rangeInvalid}
          onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
        />
      </FormField>
      <div className="flex sm:col-span-2 lg:col-span-1 lg:pt-6">
        <Button
          variant="ghost"
          onClick={clear}
          disabled={!hasFilters && !draft.search && !draft.from && !draft.to}
          className="w-full lg:w-auto"
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
