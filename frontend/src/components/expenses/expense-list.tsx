import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { formatDate, formatMoney } from '@/lib/format';
import type { Expense } from '@/types';

type ExpenseListProps = {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
};

/** A table on larger screens and stacked rows on phones, from the same data. */
export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
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
              </TableCell>
              <TableCell>
                <Badge>{e.category.name}</Badge>
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                {formatMoney(e.amount)}
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
              </div>
              <p className="shrink-0 text-sm font-medium text-foreground tabular-nums">{formatMoney(e.amount)}</p>
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

function RowActions({ expense, onEdit, onDelete }: { expense: Expense } & Omit<ExpenseListProps, 'expenses'>) {
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
