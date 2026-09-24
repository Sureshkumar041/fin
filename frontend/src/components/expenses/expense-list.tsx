import { ChevronDownIcon } from '@/components/icons';
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { formatDate, formatMoney } from '@/lib/format';
import { peopleCount } from '@/lib/split';
import type { Expense, ExpenseSplit } from '@/types';

type ExpenseListProps = {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  /** Opens the split details (from the "Split" badge of a split expense). */
  onView: (expense: Expense) => void;
};

/** A table on larger screens and stacked rows on phones, from the same data. */
export function ExpenseList({ expenses, onEdit, onDelete, onView }: ExpenseListProps) {
  return (
    <>
      <Table containerClassName="hidden sm:block">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(e.expenseDate)}</TableCell>
              <TableCell className="max-w-xs truncate">
                {e.description ?? <span className="text-muted-foreground">No description</span>}
                {e.split && <SplitLine expense={e} split={e.split} onView={onView} />}
              </TableCell>
              <TableCell>
                <Badge>{e.category.name}</Badge>
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                {e.split ? <SplitAmount expense={e} split={e.split} /> : formatMoney(e.amount)}
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <RowActions expense={e} onEdit={onEdit} onDelete={onDelete} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ul className="divide-y divide-border sm:hidden">
        {expenses.map((e) => (
          <li key={e.id} className="py-3 first:pt-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{e.description ?? e.category.name}</p>
                <p className="text-xs text-muted-foreground">
                  {e.category.name} · {formatDate(e.expenseDate)}
                </p>
                {e.split && <SplitLine expense={e} split={e.split} onView={onView} />}
              </div>
              {e.split ? (
                <div className="shrink-0 text-right text-sm font-medium text-foreground tabular-nums">
                  <SplitAmount expense={e} split={e.split} />
                </div>
              ) : (
                <p className="shrink-0 text-sm font-medium text-foreground tabular-nums">{formatMoney(e.amount)}</p>
              )}
            </div>
            <div className="mt-1 -ml-3 flex">
              <RowActions expense={e} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Split expenses show your share (your own spending) first; the full amount
 * you paid is secondary. All figures come from the API's split summary.
 */
function SplitAmount({ expense, split }: { expense: Expense; split: ExpenseSplit }) {
  const label = `Your share of ${formatMoney(expense.amount)} paid`;
  return (
    <span title={label}>
      <span className="sr-only">{label}: </span>
      <span className="block">{formatMoney(split.ownShare)}</span>
      <span aria-hidden className="block text-xs font-normal text-muted-foreground">
        of {formatMoney(expense.amount)}
      </span>
    </span>
  );
}

/**
 * "Split · 2 people" (opens the split details) and what is still owed to you.
 * The full owed/settled breakdown and every participant are in the details.
 */
function SplitLine({ expense, split, onView }: { expense: Expense; split: ExpenseSplit; onView: (e: Expense) => void }) {
  const status = split.owedToYou > 0 ? `${formatMoney(split.owedToYou)} owed` : 'All settled';
  return (
    <span className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
      <button
        type="button"
        onClick={() => onView(expense)}
        aria-label={`Split details of ${expense.description ?? expense.category.name}`}
        title="Show split details"
        className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary-soft px-2 py-0.5 font-medium whitespace-nowrap text-primary transition-colors hover:bg-primary/20"
      >
        Split · {peopleCount(split)}
        <ChevronDownIcon className="size-3 -rotate-90" />
      </button>
      <span className="truncate">{status}</span>
    </span>
  );
}

function RowActions({ expense, onEdit, onDelete }: { expense: Expense } & Omit<ExpenseListProps, 'expenses' | 'onView'>) {
  const name = expense.description ?? expense.category.name;
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => onEdit(expense)} aria-label={`Edit ${name}`}>
        Edit
      </Button>
      <Button variant="danger-ghost" size="sm" onClick={() => onDelete(expense)} aria-label={`Delete ${name}`}>
        Delete
      </Button>
    </>
  );
}
