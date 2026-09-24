import type {
  CreateExpenseInput,
  Expense,
  ExpenseFilters,
  ExpenseListResponse,
  UpdateExpenseInput,
} from '@/types';
import { apiRequest } from './client';

export const expensesApi = {
  /** Paginated, newest first. Returns { expenses, pagination }. */
  list: (filters: ExpenseFilters = {}) =>
    apiRequest<ExpenseListResponse>('/expenses', { query: filters }),

  get: (id: string) => apiRequest<{ expense: Expense }>(`/expenses/${id}`).then((r) => r.expense),

  create: (input: CreateExpenseInput) =>
    apiRequest<{ expense: Expense }>('/expenses', { method: 'POST', body: input }).then(
      (r) => r.expense,
    ),

  update: (id: string, input: UpdateExpenseInput) =>
    apiRequest<{ expense: Expense }>(`/expenses/${id}`, { method: 'PATCH', body: input }).then(
      (r) => r.expense,
    ),

  remove: (id: string) => apiRequest<void>(`/expenses/${id}`, { method: 'DELETE' }),
};
