import { AppDataSource } from '../config/data-source';
import { Category } from '../entities/category.entity';
import { Expense } from '../entities/expense.entity';

// All aggregation happens in PostgreSQL; only the summed rows come back.
// Postgres returns SUM(numeric) and COUNT(*) as strings (they can exceed JS
// number precision), so the service converts them.

export type SummaryRow = {
  total: string;
  count: string;
  monthTotal: string;
  monthCount: string;
};
export type MonthlyRow = { month: string; total: string; count: string };
export type CategoryRow = { id: string; name: string; total: string; count: string };

const expenses = () => AppDataSource.getRepository(Expense);
const categories = () => AppDataSource.getRepository(Category);

export const dashboardRepository = {
  // One pass over the user's expenses computes all four numbers.
  // FILTER (WHERE ...) restricts an aggregate to matching rows only.
  async getSummary(userId: string, monthStart: string, nextMonthStart: string) {
    const row = await expenses()
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.amount), 0)', 'total')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        'COALESCE(SUM(e.amount) FILTER (WHERE e.expenseDate >= :monthStart AND e.expenseDate < :nextMonthStart), 0)',
        'monthTotal',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE e.expenseDate >= :monthStart AND e.expenseDate < :nextMonthStart)',
        'monthCount',
      )
      .where('e.userId = :userId', { userId })
      .setParameters({ monthStart, nextMonthStart })
      .getRawOne<SummaryRow>();
    return row!; // an aggregate without GROUP BY always returns exactly one row
  },

  // Months with no expenses have no row here; the service fills them with 0.
  getMonthlyTotals(userId: string, from: string, toExclusive: string) {
    return expenses()
      .createQueryBuilder('e')
      .select("TO_CHAR(e.expenseDate, 'YYYY-MM')", 'month')
      .addSelect('SUM(e.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('e.userId = :userId', { userId })
      .andWhere('e.expenseDate >= :from', { from })
      .andWhere('e.expenseDate < :toExclusive', { toExclusive })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany<MonthlyRow>();
  },

  // Starts from the user's categories and LEFT JOINs expenses, so categories
  // with no spending in the range still appear with total 0.
  getCategoryTotals(userId: string, range: { from?: string; to?: string }) {
    // Date filters go in the JOIN condition, not WHERE: in WHERE they would
    // drop the zero-expense categories that the LEFT JOIN keeps.
    let joinCondition = 'e.userId = :userId';
    if (range.from) joinCondition += ' AND e.expenseDate >= :from';
    if (range.to) joinCondition += ' AND e.expenseDate <= :to';

    return categories()
      .createQueryBuilder('c')
      .leftJoin('c.expenses', 'e', joinCondition)
      .select('c.id', 'id')
      .addSelect('c.name', 'name')
      .addSelect('COALESCE(SUM(e.amount), 0)', 'total')
      .addSelect('COUNT(e.id)', 'count') // COUNT(e.id) skips the NULL row of an unmatched LEFT JOIN
      .where('c.userId = :userId', { userId })
      .setParameters({ from: range.from, to: range.to })
      .groupBy('c.id')
      .orderBy('total', 'DESC')
      .addOrderBy('c.name', 'ASC')
      .getRawMany<CategoryRow>();
  },
};
