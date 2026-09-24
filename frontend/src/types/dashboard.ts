import type { IsoDate, YearMonth } from './api';

export type DashboardSummary = {
  totalExpense: number;
  expenseCount: number;
  currentMonth: {
    month: YearMonth;
    totalExpense: number;
    expenseCount: number;
  };
};

export type MonthlyTotal = {
  month: YearMonth;
  totalExpense: number;
  expenseCount: number;
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
  percentage: number;
};

export type CategoryTotalsResponse = {
  from: IsoDate | null;
  to: IsoDate | null;
  totalExpense: number;
  categories: CategoryTotal[];
};
