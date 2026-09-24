import { AppDataSource } from '../config/data-source';
import { Category } from '../entities/category.entity';
import { Expense } from '../entities/expense.entity';

// All aggregation happens in PostgreSQL; only the summed rows come back.
// Postgres returns SUM(numeric) and COUNT(*) as strings (they can exceed JS
// number precision), so the service converts them.
//
// Split expenses: `amount` is the whole bill the user paid, but only their
// own share is their spending. "total" columns below are spending (the
// user's own share: amount minus the participants' shares, or the whole
// amount for a personal expense); "paid" columns are the full amounts paid.

export type SummaryRow = {
  total: string;
  paid: string;
  count: string;
  monthTotal: string;
  monthPaid: string;
  monthCount: string;
  owed: string;
  settled: string;
};
export type MonthlyRow = { month: string; total: string; paid: string; count: string };
export type CategoryRow = { id: string; name: string; total: string; paid: string; count: string };

const expenses = () => AppDataSource.getRepository(Expense);
const categories = () => AppDataSource.getRepository(Category);

// Participant shares per expense, summed before they are joined, so each
// expense joins at most one row and its amount is never counted twice.
// Scoped to the user's own expenses. Personal expenses have no row here.
const PARTICIPANT_TOTALS = `(
  SELECT p.expense_id,
    SUM(p.share_amount) AS others,
    SUM(p.share_amount) FILTER (WHERE p.status = 'PENDING') AS pending,
    SUM(p.share_amount) FILTER (WHERE p.status = 'PAID') AS settled
  FROM expense_participants p
  JOIN expenses pe ON pe.id = p.expense_id AND pe.user_id = :userId
  GROUP BY p.expense_id
)`;

// The user's own share of one expense (e joined with PARTICIPANT_TOTALS as ps).
const OWN_SHARE = '(e.amount - COALESCE(ps.others, 0))';
const IN_MONTH = 'e.expenseDate >= :monthStart AND e.expenseDate < :nextMonthStart';

export const dashboardRepository = {
  // One pass over the user's expenses computes all the numbers.
  // FILTER (WHERE ...) restricts an aggregate to matching rows only.
  async getSummary(userId: string, monthStart: string, nextMonthStart: string) {
    const row = await expenses()
      .createQueryBuilder('e')
      .leftJoin(PARTICIPANT_TOTALS, 'ps', 'ps.expense_id = e.id')
      .select(`COALESCE(SUM(${OWN_SHARE}), 0)`, 'total')
      .addSelect('COALESCE(SUM(e.amount), 0)', 'paid')
      .addSelect('COUNT(*)', 'count')
      .addSelect(`COALESCE(SUM(${OWN_SHARE}) FILTER (WHERE ${IN_MONTH}), 0)`, 'monthTotal')
      .addSelect(`COALESCE(SUM(e.amount) FILTER (WHERE ${IN_MONTH}), 0)`, 'monthPaid')
      .addSelect(`COUNT(*) FILTER (WHERE ${IN_MONTH})`, 'monthCount')
      .addSelect('COALESCE(SUM(ps.pending), 0)', 'owed')
      .addSelect('COALESCE(SUM(ps.settled), 0)', 'settled')
      .where('e.userId = :userId', { userId })
      .setParameters({ monthStart, nextMonthStart })
      .getRawOne<SummaryRow>();
    return row!; // an aggregate without GROUP BY always returns exactly one row
  },

  // Months with no expenses have no row here; the service fills them with 0.
  // An expense counts in the month of its expense date, whenever it is settled.
  getMonthlyTotals(userId: string, from: string, toExclusive: string) {
    return expenses()
      .createQueryBuilder('e')
      .leftJoin(PARTICIPANT_TOTALS, 'ps', 'ps.expense_id = e.id')
      .select("TO_CHAR(e.expenseDate, 'YYYY-MM')", 'month')
      .addSelect(`SUM(${OWN_SHARE})`, 'total')
      .addSelect('SUM(e.amount)', 'paid')
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
      .leftJoin(PARTICIPANT_TOTALS, 'ps', 'ps.expense_id = e.id')
      .select('c.id', 'id')
      .addSelect('c.name', 'name')
      .addSelect(`COALESCE(SUM(${OWN_SHARE}), 0)`, 'total')
      .addSelect('COALESCE(SUM(e.amount), 0)', 'paid')
      .addSelect('COUNT(e.id)', 'count') // COUNT(e.id) skips the NULL row of an unmatched LEFT JOIN
      .where('c.userId = :userId', { userId })
      .setParameters({ from: range.from, to: range.to })
      .groupBy('c.id')
      .orderBy('total', 'DESC')
      .addOrderBy('c.name', 'ASC')
      .getRawMany<CategoryRow>();
  },
};
