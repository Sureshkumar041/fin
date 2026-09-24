import type { IsoDate, IsoDateTime, Pagination } from './api';

export type Expense = {
  id: string;
  amount: number;
  description: string | null;
  expenseDate: IsoDate;
  category: { id: string; name: string };
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type CreateExpenseInput = {
  amount: number;
  categoryId: string;
  expenseDate: IsoDate;
  description?: string | null;
};

/** PATCH: send only the fields that change (at least one). */
export type UpdateExpenseInput = Partial<CreateExpenseInput>;

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
