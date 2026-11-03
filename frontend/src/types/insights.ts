import type { IsoDate, YearMonth } from './api';
import type { CategoryTotal, MonthlyTotal } from './dashboard';

// GET /dashboard/insights (see the backend's OpenAPI docs, DashboardInsightsResponse).
// Every total, change and percentage is calculated by the backend: display
// them as they are. `totalExpense` is your own spending, `totalPaid` the full
// amounts you paid, `othersShare` the part of those that covered split
// participants (settled or not).

export type InsightTotals = {
  totalExpense: number;
  totalPaid: number;
  othersShare: number;
  expenseCount: number;
};

/** Current minus previous. */
export type InsightMoneyChange = {
  amount: number;
  /** 2 decimal places; null when the previous value is 0 (nothing to compare against). */
  percentage: number | null;
};

export type InsightTotalsChange = {
  totalExpense: InsightMoneyChange;
  totalPaid: InsightMoneyChange;
  othersShare: InsightMoneyChange;
};

export type InsightMonthTotals = InsightTotals & { month: YearMonth };

/** Totals for a range of days, both ends inclusive. */
export type InsightPeriodTotals = InsightTotals & { from: IsoDate; to: IsoDate };

export type InsightCategorySummary = Pick<CategoryTotal, 'id' | 'name' | 'totalExpense' | 'percentage'>;

/** A category with spending in this month or the previous one. */
export type InsightCategory = CategoryTotal & {
  /** Whole month vs whole previous month. */
  fullMonth: { previousTotalExpense: number; change: InsightMoneyChange };
  /** Own spending over samePeriod.current vs samePeriod.previous. */
  samePeriod: { totalExpense: number; previousTotalExpense: number; change: InsightMoneyChange };
};

export type InsightDay = InsightTotals & { date: IsoDate };

/** A Monday-Sunday week. */
export type InsightWeek = InsightTotals & { weekStart: IsoDate; weekEnd: IsoDate };

/** 1 = Monday ... 7 = Sunday (ISO). */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** One weekday summed over the 12 weeks. */
export type InsightWeekday = InsightTotals & {
  weekday: IsoWeekday;
  /** Own spending on this weekday in an average week of the 12. */
  averageExpense: number;
};

export type InsightMonthlyTotal = MonthlyTotal & { othersShare: number };

// Observations: fixed rules on the backend. `message` is English text without
// money amounts; `data` holds the values behind it, its keys depend on `code`.

/** For spending, up is bad: an increase is "negative". */
export type ObservationTone = 'positive' | 'negative' | 'neutral';

/** samePeriod while the month is in progress, fullMonth once it is complete. */
export type ObservationComparison = 'samePeriod' | 'fullMonth';

type ObservationOf<Code extends string, Tone extends ObservationTone, Data> = {
  code: Code;
  tone: Tone;
  message: string;
  data: Data;
};

type SpendingChangeData = {
  comparison: ObservationComparison;
  percentage: number;
  amount: number;
  currentTotalExpense: number;
  previousTotalExpense: number;
  previousFrom: IsoDate;
  previousTo: IsoDate;
};

type CategoryChangeData = {
  comparison: ObservationComparison;
  categoryId: string;
  categoryName: string;
  percentage: number;
  amount: number;
  currentTotalExpense: number;
  previousTotalExpense: number;
};

export type InsightObservation =
  | ObservationOf<'NO_SPENDING', 'neutral', { from: IsoDate; to: IsoDate; totalPaid: number }>
  | ObservationOf<'SPENDING_INCREASED', 'negative', SpendingChangeData>
  | ObservationOf<'SPENDING_DECREASED', 'positive', SpendingChangeData>
  | ObservationOf<'SPENDING_UNCHANGED', 'neutral', SpendingChangeData>
  | ObservationOf<
      'TOP_CATEGORY',
      'neutral',
      { categoryId: string; categoryName: string; totalExpense: number; percentage: number }
    >
  | ObservationOf<'CATEGORY_INCREASED', 'negative', CategoryChangeData>
  | ObservationOf<'CATEGORY_DECREASED', 'positive', CategoryChangeData>
  | ObservationOf<
      'CATEGORY_NEW',
      'neutral',
      { categoryId: string; categoryName: string; totalExpense: number; newCategoryCount: number }
    >
  | ObservationOf<
      'OTHERS_SHARE',
      'neutral',
      /** percentage is of totalPaid. */
      { percentage: number; othersShare: number; totalPaid: number }
    >
  | ObservationOf<
      'BUSIEST_WEEKDAY',
      'neutral',
      {
        weekday: IsoWeekday;
        percentage: number;
        totalExpense: number;
        averageExpense: number;
        from: IsoDate;
        to: IsoDate;
      }
    >;

export type ObservationCode = InsightObservation['code'];

export type DashboardInsightsResponse = {
  month: YearMonth;
  previousMonth: YearMonth;
  /** The date used as "today". */
  date: IsoDate;
  /**
   * False while the month is in progress: `overview` then compares a partial
   * month with a whole one, and `samePeriod` is the fair comparison. When
   * true, the two are the same.
   */
  monthComplete: boolean;
  /** Whole month vs whole previous month (the same totals as the dashboard). */
  overview: {
    current: InsightMonthTotals;
    previous: InsightMonthTotals;
    change: InsightTotalsChange;
  };
  /** Days 1..N of the month vs days 1..N of the previous month, N = the day of `date`. */
  samePeriod: {
    current: InsightPeriodTotals;
    previous: InsightPeriodTotals;
    change: InsightTotalsChange;
  };
  categories: {
    /** null with no spending this month. */
    highest: InsightCategorySummary | null;
    /** Up to 3, highest first. */
    top: InsightCategorySummary[];
    items: InsightCategory[];
  };
  trends: {
    /** Every day of the month, oldest first. */
    daily: InsightDay[];
    /** The 12 whole weeks ending on or before `date`. */
    weekly: { from: IsoDate; to: IsoDate; weeks: InsightWeek[]; weekdays: InsightWeekday[] };
    /** The 12 months ending at `month`. */
    monthly: { from: YearMonth; to: YearMonth; months: InsightMonthlyTotal[] };
  };
  observations: InsightObservation[];
};
