import { dashboardRepository, type DailyRow } from '../repositories/dashboard.repository';
import { HttpError } from '../utils/http-error';
import { fromPaise, moneyChange, toPaise } from '../utils/money';
import {
  addDays,
  addMonths,
  currentDate,
  daysInMonth,
  firstDay,
  isoWeekday,
  lastDay,
  startOfIsoWeek,
} from '../utils/month';
import type { InsightsQuery } from '../validators/dashboard.validator';
import { dashboardService } from './dashboard.service';
import { observationService } from './observation.service';

// Financial insights for one month. Every number comes from the same SQL as
// the dashboard (dashboardService for months and categories, the matching
// daily query for days), so insights always agree with the dashboard.
//
// totalExpense is the user's own spending, totalPaid the full amounts they
// paid, othersShare the difference: the parts paid for split participants,
// whether those are settled or not. Calculated in integer paise.
//
// Two comparisons with the previous month:
// - overview: full month vs full month (what the dashboard shows).
// - samePeriod: days 1..N of each month, where N is how far the month has
//   got by `date`, so a month in progress isn't compared with a whole one.

const HISTORY_MONTHS = 12;
const PATTERN_WEEKS = 12;

type Range = { from: string; to: string }; // both inclusive, 'YYYY-MM-DD'

export type Totals = {
  totalExpense: number;
  totalPaid: number;
  othersShare: number;
  expenseCount: number;
};

type MonthlyResult = Awaited<ReturnType<typeof dashboardService.getMonthly>>;
type CategoriesResult = Awaited<ReturnType<typeof dashboardService.getCategories>>;

const toTotals = (spentPaise: number, paidPaise: number, count: number): Totals => ({
  totalExpense: fromPaise(spentPaise),
  totalPaid: fromPaise(paidPaise),
  othersShare: fromPaise(paidPaise - spentPaise),
  expenseCount: count,
});

const compare = (current: Totals, previous: Totals) => ({
  totalExpense: moneyChange(current.totalExpense, previous.totalExpense),
  totalPaid: moneyChange(current.totalPaid, previous.totalPaid),
  othersShare: moneyChange(current.othersShare, previous.othersShare),
});

const pad = (n: number) => String(n).padStart(2, '0');

// The ranges a month's insights cover, given the user's today (`asOf`).
export function insightPeriods(month: string, asOf: string) {
  const previousMonth = addMonths(month, -1);
  const monthEnd = lastDay(month);
  const periodEnd = asOf < monthEnd ? asOf : monthEnd;
  const monthComplete = periodEnd === monthEnd;
  // The same day number in the previous month, capped at its length. A
  // complete month lines up with the whole previous month (Feb 1-28 vs Jan 1-31).
  const previousEndDay = monthComplete
    ? daysInMonth(previousMonth)
    : Math.min(Number(periodEnd.slice(8)), daysInMonth(previousMonth));
  // Whole Monday-Sunday weeks ending on or before the period end.
  const weeksEnd = startOfIsoWeek(addDays(periodEnd, 1)); // exclusive

  return {
    previousMonth,
    monthComplete,
    current: { from: firstDay(month), to: periodEnd } as Range,
    previous: { from: firstDay(previousMonth), to: `${previousMonth}-${pad(previousEndDay)}` } as Range,
    weeks: { from: addDays(weeksEnd, -7 * PATTERN_WEEKS), to: addDays(weeksEnd, -1) } as Range,
  };
}

type DayTotals = { spent: number; paid: number; count: number }; // paise
const NO_SPENDING: DayTotals = { spent: 0, paid: 0, count: 0 };

// Every day of an inclusive range, oldest first (at most a few months).
function eachDay(range: Range): string[] {
  const days: string[] = [];
  for (let day = range.from; day <= range.to; day = addDays(day, 1)) days.push(day);
  return days;
}

function sumDays(byDay: Map<string, DayTotals>, days: string[]): Totals {
  let spent = 0;
  let paid = 0;
  let count = 0;
  for (const day of days) {
    const t = byDay.get(day) ?? NO_SPENDING;
    spent += t.spent;
    paid += t.paid;
    count += t.count;
  }
  return toTotals(spent, paid, count);
}

export type InsightsInput = {
  month: string;
  asOf: string;
  monthly: MonthlyResult;
  // Category totals per range, from categoriesFor().
  categoriesFor: (range: Range) => CategoriesResult;
  daily: DailyRow[];
};

// Builds the response from already-loaded rows. No database access, so it can
// be tested on its own.
export function buildInsights({ month, asOf, monthly, categoriesFor, daily }: InsightsInput) {
  const periods = insightPeriods(month, asOf);
  const fullMonth = { from: firstDay(month), to: lastDay(month) };
  const fullPrevious = { from: firstDay(periods.previousMonth), to: lastDay(periods.previousMonth) };

  // Full-month totals: the last two months of the dashboard's monthly series.
  const months = monthly.months.map((m) => ({
    ...m,
    othersShare: fromPaise(toPaise(m.totalPaid) - toPaise(m.totalExpense)),
  }));
  const [previousMonth, currentMonth] = months.slice(-2);
  const fromMonth = (m: (typeof months)[number]): Totals => ({
    totalExpense: m.totalExpense,
    totalPaid: m.totalPaid,
    othersShare: m.othersShare,
    expenseCount: m.expenseCount,
  });
  const overviewCurrent = fromMonth(currentMonth);
  const overviewPrevious = fromMonth(previousMonth);

  const byDay = new Map(
    daily.map((r) => [
      r.day,
      { spent: toPaise(Number(r.total)), paid: toPaise(Number(r.paid)), count: Number(r.count) },
    ]),
  );
  const samePeriodCurrent = sumDays(byDay, eachDay(periods.current));
  const samePeriodPrevious = sumDays(byDay, eachDay(periods.previous));

  // Categories: full months, plus the same-period ranges.
  const current = categoriesFor(fullMonth);
  const previousById = new Map(categoriesFor(fullPrevious).categories.map((c) => [c.id, c]));
  const periodCurrentById = new Map(categoriesFor(periods.current).categories.map((c) => [c.id, c]));
  const periodPreviousById = new Map(categoriesFor(periods.previous).categories.map((c) => [c.id, c]));
  const spentIn = (byId: Map<string, { totalExpense: number }>, id: string) => byId.get(id)?.totalExpense ?? 0;

  // Categories with spending in either month, in the dashboard's order
  // (highest this month first, then by name).
  const items = current.categories
    .filter((c) => c.totalExpense > 0 || spentIn(previousById, c.id) > 0)
    .map((c) => {
      const previousTotal = spentIn(previousById, c.id);
      const periodCurrent = spentIn(periodCurrentById, c.id);
      const periodPrevious = spentIn(periodPreviousById, c.id);
      return {
        ...c,
        fullMonth: { previousTotalExpense: previousTotal, change: moneyChange(c.totalExpense, previousTotal) },
        samePeriod: {
          totalExpense: periodCurrent,
          previousTotalExpense: periodPrevious,
          change: moneyChange(periodCurrent, periodPrevious),
        },
      };
    });
  const spending = items.filter((c) => c.totalExpense > 0);
  const summarize = (c: (typeof items)[number]) => ({
    id: c.id,
    name: c.name,
    totalExpense: c.totalExpense,
    percentage: c.percentage,
  });

  // Weekly pattern: each whole week, and each weekday summed over those weeks.
  const weekDays = eachDay(periods.weeks);
  const weeks = Array.from({ length: PATTERN_WEEKS }, (_, i) => {
    const days = weekDays.slice(i * 7, i * 7 + 7);
    return { weekStart: days[0], weekEnd: days[6], ...sumDays(byDay, days) };
  });
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const weekday = i + 1;
    const totals = sumDays(byDay, weekDays.filter((d) => isoWeekday(d) === weekday));
    return {
      weekday,
      ...totals,
      // Your spending on this weekday in an average week.
      averageExpense: fromPaise(Math.round(toPaise(totals.totalExpense) / PATTERN_WEEKS)),
    };
  });

  return {
    month,
    previousMonth: periods.previousMonth,
    date: asOf,
    // False while the month is in progress: overview compares a partial month
    // with a whole one; samePeriod is the fair comparison.
    monthComplete: periods.monthComplete,
    overview: {
      current: { month, ...overviewCurrent },
      previous: { month: periods.previousMonth, ...overviewPrevious },
      change: compare(overviewCurrent, overviewPrevious),
    },
    samePeriod: {
      current: { ...periods.current, ...samePeriodCurrent },
      previous: { ...periods.previous, ...samePeriodPrevious },
      change: compare(samePeriodCurrent, samePeriodPrevious),
    },
    categories: {
      highest: spending.length > 0 ? summarize(spending[0]) : null,
      top: spending.slice(0, 3).map(summarize),
      items,
    },
    trends: {
      // Every day of the month; days after `date` are 0 unless an expense is
      // dated in the future.
      daily: eachDay(fullMonth).map((day) => ({ date: day, ...sumDays(byDay, [day]) })),
      weekly: { ...periods.weeks, weeks, weekdays },
      monthly: { from: monthly.from, to: monthly.to, months },
    },
  };
}

export const insightsService = {
  async getInsights(userId: string, query: InsightsQuery) {
    const asOf = query.date ?? currentDate();
    const month = query.month ?? asOf.slice(0, 7);
    // Only reachable when "date" was left out and the server's date is
    // still before "month" (the validator rejects it when both are given).
    if (asOf < firstDay(month)) {
      throw new HttpError(400, 'Invalid query parameters', { month: ['"month" has not started yet'] });
    }

    const periods = insightPeriods(month, asOf);
    const ranges = [
      { from: firstDay(month), to: lastDay(month) },
      { from: firstDay(periods.previousMonth), to: lastDay(periods.previousMonth) },
      periods.current,
      periods.previous,
    ];
    // A complete month's same-period ranges are its full months: load each range once.
    const key = (r: Range) => `${r.from}|${r.to}`;
    const unique = [...new Map(ranges.map((r) => [key(r), r])).values()];
    const dailyFrom = periods.weeks.from < periods.previous.from ? periods.weeks.from : periods.previous.from;

    const [monthly, daily, ...categories] = await Promise.all([
      dashboardService.getMonthly(userId, { month, months: HISTORY_MONTHS }),
      dashboardRepository.getDailyTotals(userId, dailyFrom, firstDay(addMonths(month, 1))),
      ...unique.map((r) => dashboardService.getCategories(userId, r)),
    ]);
    const byRange = new Map(unique.map((r, i) => [key(r), categories[i]]));

    const insights = buildInsights({ month, asOf, monthly, daily, categoriesFor: (r) => byRange.get(key(r))! });
    return { ...insights, observations: observationService.build(insights) };
  },
};
