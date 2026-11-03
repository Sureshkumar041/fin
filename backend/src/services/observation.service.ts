import { fromPaise, percentOf, toPaise } from '../utils/money';
import type { buildInsights } from './insights.service';

// Rule-based observations ("Food spending is up 18%...") from the numbers the
// insights service already calculated. No HTTP, no database and no AI: every
// observation is a fixed rule over those numbers, so it can be tested on its own.
//
// Messages carry no money amounts: the backend doesn't know the user's
// display currency. Amounts are in `data` for the frontend to format.

type Insights = ReturnType<typeof buildInsights>;

export const OBSERVATION_CODES = [
  'NO_SPENDING',
  'SPENDING_INCREASED',
  'SPENDING_DECREASED',
  'SPENDING_UNCHANGED',
  'TOP_CATEGORY',
  'CATEGORY_INCREASED',
  'CATEGORY_DECREASED',
  'CATEGORY_NEW',
  'OTHERS_SHARE',
  'BUSIEST_WEEKDAY',
] as const;
export type ObservationCode = (typeof OBSERVATION_CODES)[number];

// For spending, up is bad: an increase is "negative".
export type ObservationTone = 'positive' | 'negative' | 'neutral';

export type Observation = {
  code: ObservationCode;
  tone: ObservationTone;
  message: string;
  data: Record<string, string | number | null>;
};

// Month comparisons wait until a week has passed: a day or two says little.
export const MIN_COMPARISON_DAYS = 7;
// Overall changes smaller than this (in %) are "about the same".
export const STEADY_PERCENT = 5;
// A category change is worth mentioning only when it is at least this big in
// percent AND at least this share of the month's spending, so ₹10 -> ₹30
// isn't reported as "+200%".
export const CATEGORY_MIN_PERCENT = 20;
export const CATEGORY_MIN_SHARE_PERCENT = 10;
// Busiest weekday: needs spending in at least this many of the 12 weeks, and
// at least this share of the spending (an even spread is about 14.3% a day).
export const WEEKDAY_MIN_ACTIVE_WEEKS = 4;
export const WEEKDAY_MIN_SHARE_PERCENT = 20;

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// "2026-10" -> "October". Fixed to English, like the messages.
const monthName = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });

// "2026-09-27" -> "27 September"
const dayAndMonth = (date: string) => `${Number(date.slice(8))} ${monthName(date.slice(0, 7))}`;

// Whole percent for messages; the exact value is in data.
const wholePercent = (percentage: number) => Math.round(Math.abs(percentage));

// Wording shared by the rules. A month in progress is compared "at this point"
// (the same days of the previous month); a complete month as a whole.
function wording(insights: Insights) {
  const month = monthName(insights.month);
  return {
    complete: insights.monthComplete,
    month,
    previous: monthName(insights.previousMonth),
    thisMonth: insights.monthComplete ? `in ${month}` : 'this month',
    comparison: insights.monthComplete ? 'fullMonth' : 'samePeriod',
  };
}
type Wording = ReturnType<typeof wording>;

function noSpending(insights: Insights, w: Wording): Observation | null {
  const { current } = insights.samePeriod;
  if (toPaise(current.totalExpense) > 0) return null;
  return {
    code: 'NO_SPENDING',
    tone: 'neutral',
    // While in progress, only the days up to `date` count: the totals and
    // OTHERS_SHARE cover the whole month, which can include later-dated expenses.
    message: w.complete
      ? `You didn't spend anything in ${w.month}.`
      : `You haven't spent anything this month up to ${dayAndMonth(current.to)}.`,
    data: { from: current.from, to: current.to, totalPaid: current.totalPaid },
  };
}

// Enough data to compare with the previous month: a week has passed, and
// there was spending in the previous month's matching days.
const canCompare = (insights: Insights) =>
  Number(insights.samePeriod.current.to.slice(8)) >= MIN_COMPARISON_DAYS &&
  toPaise(insights.samePeriod.previous.totalExpense) > 0;

function spendingChange(insights: Insights, w: Wording): Observation | null {
  if (!canCompare(insights)) return null;
  const { current, previous, change } = insights.samePeriod;
  const percentage = change.totalExpense.percentage!; // previous > 0, so never null
  const data = {
    comparison: w.comparison,
    percentage,
    amount: change.totalExpense.amount,
    currentTotalExpense: current.totalExpense,
    previousTotalExpense: previous.totalExpense,
    previousFrom: previous.from,
    previousTo: previous.to,
  };

  if (Math.abs(percentage) < STEADY_PERCENT) {
    return {
      code: 'SPENDING_UNCHANGED',
      tone: 'neutral',
      message: w.complete
        ? `You spent about the same in ${w.month} as in ${w.previous}.`
        : `Your spending is about the same as at this point in ${w.previous}.`,
      data,
    };
  }
  const up = percentage > 0;
  const more = `${wholePercent(percentage)}% ${up ? 'more' : 'less'}`;
  return {
    code: up ? 'SPENDING_INCREASED' : 'SPENDING_DECREASED',
    tone: up ? 'negative' : 'positive',
    message: w.complete
      ? `You spent ${more} in ${w.month} than in ${w.previous}.`
      : `You've spent ${more} than at this point in ${w.previous}.`,
    data,
  };
}

function topCategory(insights: Insights, w: Wording): Observation | null {
  const { highest, items } = insights.categories;
  if (!highest) return null;
  const spendingCategories = items.filter((c) => c.totalExpense > 0).length;
  let message: string;
  if (spendingCategories === 1) {
    message = w.complete
      ? `All your spending in ${w.month} was on ${highest.name}.`
      : `All your spending this month has been on ${highest.name}.`;
  } else {
    message = `${highest.name} ${w.complete ? 'was' : 'is'} your top category ${w.thisMonth}, at ${wholePercent(highest.percentage)}% of your spending.`;
  }
  return {
    code: 'TOP_CATEGORY',
    tone: 'neutral',
    message,
    data: {
      categoryId: highest.id,
      categoryName: highest.name,
      totalExpense: highest.totalExpense,
      percentage: highest.percentage,
    },
  };
}

// The biggest notable increase and decrease, compared over the same days.
function categoryChanges(insights: Insights, w: Wording): Observation[] {
  if (!canCompare(insights)) return [];
  const { current, previous } = insights.samePeriod;
  const compared = insights.categories.items.filter(
    (c) => c.samePeriod.totalExpense > 0 || c.samePeriod.previousTotalExpense > 0,
  );
  // With one category its change is the overall change: already said.
  if (compared.length < 2) return [];

  const basePaise = Math.max(toPaise(current.totalExpense), toPaise(previous.totalExpense));
  const notable = compared.filter((c) => {
    const { percentage, amount } = c.samePeriod.change;
    return (
      percentage !== null && // null = nothing last month: that's CATEGORY_NEW
      Math.abs(percentage) >= CATEGORY_MIN_PERCENT &&
      Math.abs(toPaise(amount)) * 100 >= basePaise * CATEGORY_MIN_SHARE_PERCENT
    );
  });
  // Largest change in money; ties keep the dashboard's order.
  const biggest = (list: typeof notable) =>
    list.reduce<(typeof notable)[number] | null>(
      (best, c) => (!best || Math.abs(c.samePeriod.change.amount) > Math.abs(best.samePeriod.change.amount) ? c : best),
      null,
    );
  const increase = biggest(notable.filter((c) => c.samePeriod.change.amount > 0));
  const decrease = biggest(notable.filter((c) => c.samePeriod.change.amount < 0));

  const observation = (c: NonNullable<typeof increase>): Observation => {
    const { change, totalExpense, previousTotalExpense } = c.samePeriod;
    const up = change.amount > 0;
    const percent = wholePercent(change.percentage!);
    let message: string;
    if (!up && totalExpense === 0) {
      message = w.complete
        ? `You didn't spend on ${c.name} in ${w.month}, unlike ${w.previous}.`
        : `You haven't spent on ${c.name} yet this month, unlike this point in ${w.previous}.`;
    } else {
      const direction = `${up ? 'up' : 'down'} ${percent}%`;
      message = w.complete
        ? `${c.name} spending was ${direction} in ${w.month} compared with ${w.previous}.`
        : `${c.name} spending is ${direction} compared with this point in ${w.previous}.`;
    }
    return {
      code: up ? 'CATEGORY_INCREASED' : 'CATEGORY_DECREASED',
      tone: up ? 'negative' : 'positive',
      message,
      data: {
        comparison: w.comparison,
        categoryId: c.id,
        categoryName: c.name,
        percentage: change.percentage,
        amount: change.amount,
        currentTotalExpense: totalExpense,
        previousTotalExpense,
      },
    };
  };
  return [increase, decrease].flatMap((c) => (c ? [observation(c)] : []));
}

// Categories with spending this month and none in the whole previous month.
// Needs some spending last month, or every category of a new user is "new".
function newCategory(insights: Insights, w: Wording): Observation | null {
  if (toPaise(insights.overview.previous.totalExpense) === 0) return null;
  const fresh = insights.categories.items.filter(
    (c) => c.totalExpense > 0 && c.fullMonth.previousTotalExpense === 0,
  );
  if (fresh.length === 0) return null;
  const [first] = fresh; // highest spending first
  const others = fresh.length - 1;
  const verb = w.complete ? 'was' : 'is';
  const message =
    others === 0
      ? `${first.name} ${verb} new ${w.thisMonth}: you didn't spend on it in ${w.previous}.`
      : `${first.name} and ${others} other ${others === 1 ? 'category' : 'categories'} ${w.complete ? 'were' : 'are'} new ${w.thisMonth}: no spending on them in ${w.previous}.`;
  return {
    code: 'CATEGORY_NEW',
    tone: 'neutral',
    message,
    data: {
      categoryId: first.id,
      categoryName: first.name,
      totalExpense: first.totalExpense,
      newCategoryCount: fresh.length,
    },
  };
}

// How much of what the user paid covered split participants' shares.
function othersShare(insights: Insights, w: Wording): Observation | null {
  const { totalPaid, othersShare: others } = insights.overview.current;
  if (toPaise(others) <= 0) return null;
  const share = percentOf(others, totalPaid)!; // others > 0, so totalPaid > 0
  // Never "0%" for a real amount.
  const percent = wholePercent(share) === 0 ? 'Less than 1%' : `${wholePercent(share)}%`;
  return {
    code: 'OTHERS_SHARE',
    tone: 'neutral',
    message: w.complete
      ? `${percent} of what you paid in ${w.month} covered other people's shares.`
      : `${percent} of what you've paid this month covered other people's shares.`,
    data: { percentage: share, othersShare: others, totalPaid },
  };
}

function busiestWeekday(insights: Insights, w: Wording): Observation | null {
  const { weeks, weekdays, from, to } = insights.trends.weekly;
  if (weeks.filter((week) => week.totalExpense > 0).length < WEEKDAY_MIN_ACTIVE_WEEKS) return null;

  const total = weekdays.reduce((sum, d) => sum + toPaise(d.totalExpense), 0);
  const [top, second] = [...weekdays].sort((a, b) => b.totalExpense - a.totalExpense);
  // A tie has no single busiest day.
  if (toPaise(top.totalExpense) === toPaise(second.totalExpense)) return null;
  const share = percentOf(top.totalExpense, fromPaise(total))!; // at least one active week, so total > 0
  if (share < WEEKDAY_MIN_SHARE_PERCENT) return null;

  const period = w.complete ? `the 12 weeks to ${dayAndMonth(to)}` : 'the last 12 weeks';
  return {
    code: 'BUSIEST_WEEKDAY',
    tone: 'neutral',
    message: `You spend the most on ${WEEKDAY_NAMES[top.weekday - 1]}s: ${wholePercent(share)}% of your spending over ${period}.`,
    data: {
      weekday: top.weekday,
      percentage: share,
      totalExpense: top.totalExpense,
      averageExpense: top.averageExpense,
      from,
      to,
    },
  };
}

export const observationService = {
  // In a fixed order, at most one observation per code. With no spending so
  // far, the comparisons and category rules have nothing true to say.
  build(insights: Insights): Observation[] {
    const w = wording(insights);
    const none = noSpending(insights, w);
    const spending = none
      ? []
      : [
          spendingChange(insights, w),
          topCategory(insights, w),
          ...categoryChanges(insights, w),
          newCategory(insights, w),
        ];
    return [none, ...spending, othersShare(insights, w), busiestWeekday(insights, w)].filter(
      (o): o is Observation => o !== null,
    );
  },
};
