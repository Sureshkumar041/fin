import type {
  CreateExpenseInput,
  Expense,
  ExpenseFilters,
  ExpenseListResponse,
  SettlementStatus,
  SplitInput,
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

  /** Makes a personal expense a split, or replaces its split. 409 if anyone has paid. */
  replaceSplit: (id: string, input: SplitInput) =>
    apiRequest<{ expense: Expense }>(`/expenses/${id}/split`, { method: 'PUT', body: input }).then(
      (r) => r.expense,
    ),

  /** Back to a personal expense (the expense stays). 409 if anyone has paid, or if there is no split. */
  removeSplit: (id: string) =>
    apiRequest<{ expense: Expense }>(`/expenses/${id}/split`, { method: 'DELETE' }).then(
      (r) => r.expense,
    ),

  /** Marks a participant's share PAID or back to PENDING. `participantId` is split.participants[].id. */
  settleParticipant: (id: string, participantId: string, status: SettlementStatus) =>
    apiRequest<{ expense: Expense }>(`/expenses/${id}/split/participants/${participantId}`, {
      method: 'PATCH',
      body: { status },
    }).then((r) => r.expense),
};
