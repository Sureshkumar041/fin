import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DailyRow } from '../repositories/dashboard.repository';
import { percentOf } from '../utils/money';
import { addDays, addMonths, firstDay, lastDay } from '../utils/month';
import { buildInsights } from './insights.service';
import { OBSERVATION_CODES, observationService, type ObservationCode } from './observation.service';

// Builds real insights (through buildInsights) from a small description:
// - months: full-month [spent, paid] totals, as /dashboard/monthly returns them
// - days: spending per date, a number or [spent, paid]
// - categories: [current, previous] spending; `full` for whole months,
//   `period` for the same-period ranges (defaults to `full`)
type Pair = [number, number];
type Spec = {
  month?: string;
  asOf?: string;
  months?: { current?: Pair; previous?: Pair };
  days?: Record<string, number | Pair>;
  categories?: { name: string; full: Pair; period?: Pair }[];
};

function insights(spec: Spec = {}) {
  const month = spec.month ?? '2026-11';
  const asOf = spec.asOf ?? '2026-11-20';
  const previousMonth = addMonths(month, -1);
  const [currentSpent, currentPaid] = spec.months?.current ?? [0, 0];
  const [previousSpent, previousPaid] = spec.months?.previous ?? [0, 0];
  const categories = spec.categories ?? [];

  const categoryList = (pick: (c: (typeof categories)[number]) => number) => {
    const total = categories.reduce((sum, c) => sum + pick(c), 0);
    return {
      from: null,
      to: null,
      totalExpense: total,
      totalPaid: total,
      categories: categories
        .map((c, i) => ({
          id: `category-${i}`,
          name: c.name,
          totalExpense: pick(c),
          totalPaid: pick(c),
          expenseCount: pick(c) > 0 ? 1 : 0,
          percentage: percentOf(pick(c), total) ?? 0,
        }))
        .sort((a, b) => b.totalExpense - a.totalExpense),
    };
  };

  const daily: DailyRow[] = Object.entries(spec.days ?? {}).map(([day, value]) => {
    const [spent, paid] = typeof value === 'number' ? [value, value] : value;
    return { day, total: spent.toFixed(2), paid: paid.toFixed(2), count: '1' };
  });

  return buildInsights({
    month,
    asOf,
    monthly: {
      from: previousMonth,
      to: month,
      months: [
        { month: previousMonth, totalExpense: previousSpent, expenseCount: 1, totalPaid: previousPaid },
        { month, totalExpense: currentSpent, expenseCount: 1, totalPaid: currentPaid },
      ],
    },
    daily,
    categoriesFor: (range) => {
      if (range.from === firstDay(month) && range.to === lastDay(month)) return categoryList((c) => c.full[0]);
      if (range.from === firstDay(previousMonth) && range.to === lastDay(previousMonth)) {
        return categoryList((c) => c.full[1]);
      }
      if (range.from === firstDay(month)) return categoryList((c) => (c.period ?? c.full)[0]);
      return categoryList((c) => (c.period ?? c.full)[1]);
    },
  });
}

const observe = (spec: Spec = {}) => observationService.build(insights(spec));
const codes = (spec: Spec = {}) => observe(spec).map((o) => o.code);
const find = (spec: Spec, code: ObservationCode) => observe(spec).find((o) => o.code === code);

// Every `count` weeks' `weekday` (1 = Monday) inside the 12 weeks before
// 2026-11-20, which are 2026-08-24 (a Monday) to 2026-11-15.
const weekly = (weekday: number, count: number, amount: number) =>
  Object.fromEntries(Array.from({ length: count }, (_, i) => [addDays('2026-08-24', weekday - 1 + i * 7), amount]));

describe('NO_SPENDING', () => {
  it('says so for a month in progress, and nothing else', () => {
    const [observation, ...rest] = observe();
    assert.deepEqual(rest, []);
    assert.equal(observation.code, 'NO_SPENDING');
    assert.equal(observation.tone, 'neutral');
    assert.equal(observation.message, "You haven't spent anything this month up to 20 November.");
  });

  it('uses the past tense for a complete month', () => {
    assert.equal(
      find({ month: '2026-09', asOf: '2026-11-03' }, 'NO_SPENDING')?.message,
      "You didn't spend anything in September.",
    );
  });

  it('suppresses comparisons and category rules, which would only repeat it', () => {
    const spec: Spec = {
      months: { previous: [100, 100] },
      days: { '2026-10-05': 100 },
      categories: [{ name: 'Food', full: [0, 100] }],
    };
    assert.deepEqual(codes(spec), ['NO_SPENDING']);
  });
});

describe('SPENDING_INCREASED / DECREASED / UNCHANGED', () => {
  it('compares a month in progress with the same days of the previous month', () => {
    const observation = find(
      // The 500 on 25 Oct is after day 20, so it is not compared.
      { days: { '2026-10-05': 100, '2026-10-25': 500, '2026-11-05': 118 } },
      'SPENDING_INCREASED',
    );
    assert.equal(observation?.message, "You've spent 18% more than at this point in October.");
    assert.equal(observation?.tone, 'negative');
    assert.deepEqual(observation?.data, {
      comparison: 'samePeriod',
      percentage: 18,
      amount: 18,
      currentTotalExpense: 118,
      previousTotalExpense: 100,
      previousFrom: '2026-10-01',
      previousTo: '2026-10-20',
    });
  });

  it('compares whole months once the month is complete', () => {
    const observation = find(
      { month: '2026-10', asOf: '2026-11-03', days: { '2026-09-10': 200, '2026-10-10': 150 } },
      'SPENDING_DECREASED',
    );
    assert.equal(observation?.message, 'You spent 25% less in October than in September.');
    assert.equal(observation?.tone, 'positive');
    assert.equal(observation?.data.comparison, 'fullMonth');
  });

  it('calls a change under 5% "about the same"', () => {
    const observation = find({ days: { '2026-10-05': 100, '2026-11-05': 104.99 } }, 'SPENDING_UNCHANGED');
    assert.equal(observation?.message, 'Your spending is about the same as at this point in October.');
    assert.equal(observation?.tone, 'neutral');
  });

  it('waits until a week of the month has passed', () => {
    const days = { '2026-10-02': 100, '2026-11-02': 300 };
    assert.equal(codes({ asOf: '2026-11-06', days }).includes('SPENDING_INCREASED'), false);
    assert.equal(codes({ asOf: '2026-11-07', days }).includes('SPENDING_INCREASED'), true);
  });

  it('says nothing without spending in the previous period', () => {
    const result = codes({ days: { '2026-10-25': 100, '2026-11-05': 100 } });
    assert.equal(result.some((c) => c.startsWith('SPENDING_')), false);
  });
});

describe('TOP_CATEGORY', () => {
  const days = { '2026-11-05': 100 };

  it('names the highest category and its share', () => {
    const observation = find(
      { days, categories: [{ name: 'Rent', full: [30, 0] }, { name: 'Food', full: [70, 0] }] },
      'TOP_CATEGORY',
    );
    assert.equal(observation?.message, 'Food is your top category this month, at 70% of your spending.');
    assert.equal(observation?.data.categoryName, 'Food');
  });

  it('words a single category differently', () => {
    assert.equal(
      find({ days, categories: [{ name: 'Food', full: [100, 0] }] }, 'TOP_CATEGORY')?.message,
      'All your spending this month has been on Food.',
    );
  });

  it('uses the past tense for a complete month', () => {
    const spec: Spec = {
      month: '2026-09',
      asOf: '2026-11-03',
      days: { '2026-09-05': 100 },
      categories: [{ name: 'Food', full: [70, 0] }, { name: 'Rent', full: [30, 0] }],
    };
    assert.equal(find(spec, 'TOP_CATEGORY')?.message, 'Food was your top category in September, at 70% of your spending.');
  });
});

describe('CATEGORY_INCREASED / CATEGORY_DECREASED', () => {
  // 1,000 spent in each period: a notable change is >= 20% and >= 100.
  const days = { '2026-10-05': 1000, '2026-11-05': 1000 };

  it('reports the biggest notable increase and decrease', () => {
    const result = observe({
      days,
      categories: [
        { name: 'Food', full: [300, 100] }, // +200, +200%
        { name: 'Rent', full: [600, 500] }, // +100, +20%: notable, but smaller
        { name: 'Travel', full: [100, 400] }, // -300, -75%
        { name: 'Snacks', full: [5, 1] }, // +400%, but only +4
      ],
    });
    const increase = result.find((o) => o.code === 'CATEGORY_INCREASED');
    const decrease = result.find((o) => o.code === 'CATEGORY_DECREASED');
    assert.equal(increase?.message, 'Food spending is up 200% compared with this point in October.');
    assert.equal(increase?.tone, 'negative');
    assert.equal(decrease?.message, 'Travel spending is down 75% compared with this point in October.');
    assert.equal(decrease?.tone, 'positive');
    assert.deepEqual(decrease?.data, {
      comparison: 'samePeriod',
      categoryId: 'category-2',
      categoryName: 'Travel',
      percentage: -75,
      amount: -300,
      currentTotalExpense: 100,
      previousTotalExpense: 400,
    });
  });

  it('ignores small percentage changes', () => {
    const result = codes({
      days,
      categories: [{ name: 'Food', full: [550, 500] }, { name: 'Rent', full: [450, 500] }], // +-10%
    });
    assert.equal(result.some((c) => c.startsWith('CATEGORY_')), false);
  });

  it('ignores big percentages on small amounts', () => {
    const result = codes({
      days,
      categories: [{ name: 'Snacks', full: [30, 10] }, { name: 'Rent', full: [970, 990] }], // +200% of 20
    });
    assert.equal(result.some((c) => c.startsWith('CATEGORY_')), false);
  });

  it('words a drop to zero', () => {
    const observation = find(
      { days, categories: [{ name: 'Food', full: [1000, 600] }, { name: 'Travel', full: [0, 400] }] },
      'CATEGORY_DECREASED',
    );
    assert.equal(observation?.message, "You haven't spent on Travel yet this month, unlike this point in October.");
  });

  it('compares the same period, not whole months', () => {
    const observation = find(
      {
        days,
        // Whole months look flat; the first 20 days don't.
        categories: [
          { name: 'Food', full: [500, 500], period: [800, 400] },
          { name: 'Rent', full: [500, 500], period: [200, 600] },
        ],
      },
      'CATEGORY_INCREASED',
    );
    assert.equal(observation?.data.percentage, 100);
  });

  it('says nothing with a single category (the overall change already covers it)', () => {
    assert.equal(
      codes({ days, categories: [{ name: 'Food', full: [1000, 500] }] }).some((c) => c.startsWith('CATEGORY_IN')),
      false,
    );
  });

  it('says nothing before a week has passed', () => {
    const result = codes({
      asOf: '2026-11-06',
      days: { '2026-10-05': 1000, '2026-11-05': 1000 },
      categories: [{ name: 'Food', full: [300, 100] }, { name: 'Travel', full: [700, 900] }],
    });
    assert.equal(result.some((c) => c === 'CATEGORY_INCREASED' || c === 'CATEGORY_DECREASED'), false);
  });

  it('leaves a category with nothing last month to CATEGORY_NEW', () => {
    const result = observe({
      months: { current: [1000, 1000], previous: [1000, 1000] },
      days,
      categories: [{ name: 'Food', full: [600, 1000] }, { name: 'Gym', full: [400, 0] }],
    });
    assert.equal(result.find((o) => o.code === 'CATEGORY_INCREASED'), undefined);
    assert.equal(result.find((o) => o.code === 'CATEGORY_NEW')?.data.categoryName, 'Gym');
  });
});

describe('CATEGORY_NEW', () => {
  const base: Spec = { months: { current: [1000, 1000], previous: [1000, 1000] }, days: { '2026-11-05': 1000 } };

  it('names a category with no spending last month', () => {
    const observation = find(
      { ...base, categories: [{ name: 'Food', full: [600, 1000] }, { name: 'Gym', full: [400, 0] }] },
      'CATEGORY_NEW',
    );
    assert.equal(observation?.message, "Gym is new this month: you didn't spend on it in October.");
    assert.equal(observation?.data.newCategoryCount, 1);
  });

  it('groups several new categories into one observation', () => {
    const observation = find(
      {
        ...base,
        categories: [
          { name: 'Food', full: [500, 1000] },
          { name: 'Books', full: [100, 0] },
          { name: 'Gym', full: [400, 0] },
        ],
      },
      'CATEGORY_NEW',
    );
    assert.equal(observation?.message, 'Gym and 1 other category are new this month: no spending on them in October.');
    assert.equal(observation?.data.newCategoryCount, 2);
  });

  it('says nothing when there was no spending at all last month', () => {
    const spec: Spec = {
      months: { current: [1000, 1000] },
      days: { '2026-11-05': 1000 },
      categories: [{ name: 'Gym', full: [1000, 0] }],
    };
    assert.equal(codes(spec).includes('CATEGORY_NEW'), false);
  });
});

describe('OTHERS_SHARE', () => {
  const days = { '2026-11-05': [614.5, 818] as Pair };

  it('gives the share of payments that covered other people', () => {
    const observation = find({ months: { current: [614.5, 818] }, days }, 'OTHERS_SHARE');
    assert.equal(observation?.message, "25% of what you've paid this month covered other people's shares.");
    assert.deepEqual(observation?.data, { percentage: 24.88, othersShare: 203.5, totalPaid: 818 });
  });

  it('never says 0% for a real amount', () => {
    const observation = find({ months: { current: [1000, 1000.5] }, days }, 'OTHERS_SHARE');
    assert.equal(observation?.message, "Less than 1% of what you've paid this month covered other people's shares.");
  });

  it('says nothing without split expenses', () => {
    assert.equal(codes({ months: { current: [100, 100] }, days: { '2026-11-05': 100 } }).includes('OTHERS_SHARE'), false);
  });
});

describe('BUSIEST_WEEKDAY', () => {
  it('names a clear busiest weekday over the last 12 weeks', () => {
    const observation = find(
      { days: { ...weekly(6, 5, 100), '2026-08-24': 50 } }, // 5 Saturdays of 100, one Monday of 50
      'BUSIEST_WEEKDAY',
    );
    assert.equal(observation?.message, 'You spend the most on Saturdays: 91% of your spending over the last 12 weeks.');
    assert.deepEqual(observation?.data, {
      weekday: 6,
      percentage: 90.91,
      totalExpense: 500,
      averageExpense: 41.67,
      from: '2026-08-24',
      to: '2026-11-15',
    });
  });

  it('names the end of the range for a complete month', () => {
    // September's 12 weeks end on Sunday 27 Sep and start on 6 Jul (a Monday).
    const saturdays = Object.fromEntries(
      Array.from({ length: 4 }, (_, i) => [addDays('2026-07-11', i * 7), 100]),
    );
    const observation = find({ month: '2026-09', asOf: '2026-11-03', days: saturdays }, 'BUSIEST_WEEKDAY');
    assert.equal(
      observation?.message,
      'You spend the most on Saturdays: 100% of your spending over the 12 weeks to 27 September.',
    );
  });

  it('needs spending in at least 4 of the weeks', () => {
    assert.equal(codes({ days: weekly(6, 3, 100) }).includes('BUSIEST_WEEKDAY'), false);
  });

  it('says nothing on a tie', () => {
    assert.equal(codes({ days: { ...weekly(6, 4, 100), ...weekly(1, 4, 100) } }).includes('BUSIEST_WEEKDAY'), false);
  });

  it('says nothing when spending is spread evenly', () => {
    const days = Object.assign({}, ...[1, 2, 3, 4, 5, 6, 7].map((d) => weekly(d, 4, d === 1 ? 11 : 10)));
    assert.equal(codes({ days }).includes('BUSIEST_WEEKDAY'), false); // Monday: 44 of 284, 15.5%
  });
});

describe('observationService.build', () => {
  it('returns each code at most once, in a fixed order, with display text and data', () => {
    const result = observe({
      months: { current: [1500, 2000], previous: [1000, 1000] },
      days: { ...weekly(6, 5, 100), '2026-10-05': 1000, '2026-11-05': 1500 },
      categories: [
        { name: 'Food', full: [900, 500] },
        { name: 'Travel', full: [100, 500] },
        { name: 'Gym', full: [500, 0] },
      ],
    });
    const result_codes = result.map((o) => o.code);
    assert.deepEqual(result_codes, [
      'SPENDING_INCREASED',
      'TOP_CATEGORY',
      'CATEGORY_INCREASED',
      'CATEGORY_DECREASED',
      'CATEGORY_NEW',
      'OTHERS_SHARE',
      'BUSIEST_WEEKDAY',
    ]);
    assert.deepEqual(
      [...result_codes].sort((a, b) => OBSERVATION_CODES.indexOf(a) - OBSERVATION_CODES.indexOf(b)),
      result_codes,
    );
    for (const o of result) {
      assert.ok(['positive', 'negative', 'neutral'].includes(o.tone));
      assert.ok(o.message.length > 0 && o.message.length <= 120, o.message);
      assert.equal(typeof o.data, 'object');
    }
  });
});
