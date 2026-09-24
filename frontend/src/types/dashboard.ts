import type { IsoDate, YearMonth } from './api';

// Split expenses: `totalExpense` is always your own spending (personal
// amounts plus your own share of split bills). `totalPaid` is the full amount
// you paid, including other people's shares; without splits the two are equal.

export type MonthlyTotal = {
  month: YearMonth;
  totalExpense: number;
  expenseCount: number;
  totalPaid: number;
};

export type DashboardSummary = {
  totalExpense: number;
  expenseCount: number;
  currentMonth: MonthlyTotal;
  totalPaid: number;
  /** Split participants' shares still PENDING (all time). */
  owedToYou: number;
  /** Split participants' shares already PAID back (all time). */
  settledToYou: number;
};

export type MonthlyTotalsResponse = {
  from: YearMonth;
  to: YearMonth;
  months: MonthlyTotal[];
};

export type CategoryTotal = {
  id: string;
  name: string;
  totalExpense: number;
  expenseCount: number;
  totalPaid: number;
  /** Share of your own spending in the range. */
  percentage: number;
};

export type CategoryTotalsResponse = {
  from: IsoDate | null;
  to: IsoDate | null;
  totalExpense: number;
  totalPaid: number;
  categories: CategoryTotal[];
};
