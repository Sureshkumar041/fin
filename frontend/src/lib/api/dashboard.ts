import type {
  CategoryTotalsResponse,
  DashboardSummary,
  IsoDate,
  MonthlyTotalsResponse,
  YearMonth,
} from '@/types';
import { currentYearMonth } from '@/lib/format';
import { apiRequest } from './client';

// The browser's local month is sent as "current", so totals follow the
// user's timezone rather than the server's.
export const dashboardApi = {
  summary: (month: YearMonth = currentYearMonth()) =>
    apiRequest<{ summary: DashboardSummary }>('/dashboard/summary', { query: { month } }).then(
      (r) => r.summary,
    ),

  monthly: (options: { months?: number; month?: YearMonth } = {}) =>
    apiRequest<MonthlyTotalsResponse>('/dashboard/monthly', {
      query: { months: options.months, month: options.month ?? currentYearMonth() },
    }),

  categories: (range: { from?: IsoDate; to?: IsoDate } = {}) =>
    apiRequest<CategoryTotalsResponse>('/dashboard/categories', { query: range }),
};
