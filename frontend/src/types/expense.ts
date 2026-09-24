import type { IsoDate, IsoDateTime, Pagination } from './api';
import type { ExpenseSplit, SplitInput } from './split';

export type Expense = {
  id: string;
  amount: number;
  description: string | null;
  expenseDate: IsoDate;
  category: { id: string; name: string };
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  /** null for a normal personal expense. `amount` is always the full amount you paid. */
  split: ExpenseSplit | null;
};

export type CreateExpenseInput = {
  amount: number;
  categoryId: string;
  expenseDate: IsoDate;
  description?: string | null;
  /** Leave out for a personal expense. */
  split?: SplitInput;
};

/**
 * PATCH: send only the fields that change (at least one). The split itself
 * is changed with PUT/DELETE /expenses/:id/split, not here.
 */
export type UpdateExpenseInput = Partial<Omit<CreateExpenseInput, 'split'>>;

/** Query parameters for GET /expenses. All optional. */
export type ExpenseFilters = {
  page?: number;
  limit?: number;
  categoryId?: string;
  from?: IsoDate;
  to?: IsoDate;
  search?: string;
};

export type ExpenseListResponse = {
  expenses: Expense[];
  pagination: Pagination;
};
