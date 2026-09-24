import Link from 'next/link';
import { Button } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import type { Category, CategoryTotal } from '@/types';

type CategoryListProps = {
  categories: Category[];
  /** Per-category totals; undefined while loading or if that request failed. */
  totals?: Map<string, CategoryTotal>;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export function CategoryList({ categories, totals, onEdit, onDelete }: CategoryListProps) {
  return (
    <ul className="divide-y divide-border">
      {categories.map((c) => {
        const total = totals?.get(c.id);
        return (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
              {total && (
                <p className="text-xs text-muted-foreground">
                  {total.expenseCount === 0 ? (
                    'No expenses'
                  ) : (
                    <Link href={`/expenses?categoryId=${c.id}`} className="hover:text-foreground hover:underline">
                      {total.expenseCount} expense{total.expenseCount === 1 ? '' : 's'} ·{' '}
                      {formatMoney(total.totalExpense)}
                    </Link>
                  )}
                </p>
              )}
            </div>
            <div className="-mr-3 flex shrink-0">
              <Button variant="ghost" size="sm" onClick={() => onEdit(c)} aria-label={`Rename ${c.name}`}>
                Rename
              </Button>
              <Button variant="danger-ghost" size="sm" onClick={() => onDelete(c)} aria-label={`Delete ${c.name}`}>
                Delete
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
