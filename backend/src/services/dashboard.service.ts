import { dashboardRepository } from '../repositories/dashboard.repository';
import { addMonths, currentMonth, firstDay } from '../utils/month';
import type {
  CategoriesQuery,
  MonthlyQuery,
  SummaryQuery,
} from '../validators/dashboard.validator';

// Money sums arrive as strings like "1234.50". Round to cents to clear any
// floating-point noise after conversion.
const toMoney = (value: string | number) => Math.round(Number(value) * 100) / 100;

export const dashboardService = {
  async getSummary(userId: string, query: SummaryQuery) {
    const month = query.month ?? currentMonth();
    const row = await dashboardRepository.getSummary(
      userId,
      firstDay(month),
      firstDay(addMonths(month, 1)),
    );

    return {
      totalExpense: toMoney(row.total),
      expenseCount: Number(row.count),
      currentMonth: {
        month,
        totalExpense: toMoney(row.monthTotal),
        expenseCount: Number(row.monthCount),
      },
    };
  },

  async getMonthly(userId: string, query: MonthlyQuery) {
    const lastMonth = query.month ?? currentMonth();
    const firstMonth = addMonths(lastMonth, -(query.months - 1));

    const rows = await dashboardRepository.getMonthlyTotals(
      userId,
      firstDay(firstMonth),
      firstDay(addMonths(lastMonth, 1)),
    );

    // At most 36 rows. Fill months with no expenses so charts get a
    // continuous series.
    const byMonth = new Map(rows.map((r) => [r.month, r]));
    const months = Array.from({ length: query.months }, (_, i) => {
      const month = addMonths(firstMonth, i);
      const row = byMonth.get(month);
      return {
        month,
        totalExpense: row ? toMoney(row.total) : 0,
        expenseCount: row ? Number(row.count) : 0,
      };
    });

    return { from: firstMonth, to: lastMonth, months };
  },

  async getCategories(userId: string, query: CategoriesQuery) {
    const rows = await dashboardRepository.getCategoryTotals(userId, query);
    const grandTotal = toMoney(rows.reduce((sum, r) => sum + Number(r.total), 0));

    return {
      from: query.from ?? null,
      to: query.to ?? null,
      totalExpense: grandTotal,
      categories: rows.map((r) => {
        const total = toMoney(r.total);
        return {
          id: r.id,
          name: r.name,
          totalExpense: total,
          expenseCount: Number(r.count),
          // Share of spending in the range, for pie/bar charts.
          percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 10000) / 100 : 0,
        };
      }),
    };
  },
};
