import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DailyRow } from '../repositories/dashboard.repository';
import { buildInsights, insightPeriods, type InsightsInput } from './insights.service';

describe('insightPeriods', () => {
  it('compares a month in progress with the same days of the previous month', () => {
    const p = insightPeriods('2026-11', '2026-11-03');
    assert.equal(p.monthComplete, false);
    assert.deepEqual(p.current, { from: '2026-11-01', to: '2026-11-03' });
    assert.deepEqual(p.previous, { from: '2026-10-01', to: '2026-10-03' });
  });

  it('caps the day at a shorter previous month', () => {
    const p = insightPeriods('2026-03', '2026-03-30');
    assert.deepEqual(p.previous, { from: '2026-02-01', to: '2026-02-28' });
  });

  it('lines up a complete month with the whole previous month', () => {
    const p = insightPeriods('2026-02', '2026-11-03');
    assert.equal(p.monthComplete, true);
    assert.deepEqual(p.current, { from: '2026-02-01', to: '2026-02-28' });
    assert.deepEqual(p.previous, { from: '2026-01-01', to: '2026-01-31' });
  });

  it('covers the 12 whole Monday-Sunday weeks before the period end', () => {
    // 2026-11-03 is a Tuesday: the current week is not over yet.
    assert.deepEqual(insightPeriods('2026-11', '2026-11-03').weeks, { from: '2026-08-10', to: '2026-11-01' });
    // 2026-11-08 is a Sunday: its week is complete and included.
    assert.deepEqual(insightPeriods('2026-11', '2026-11-08').weeks, { from: '2026-08-17', to: '2026-11-08' });
  });
});

// A two-month history with Oct and Nov; categories by range from a lookup.
function input(overrides: Partial<InsightsInput> & { daily: DailyRow[] }): InsightsInput {
  const empty = { from: null, to: null, totalExpense: 0, totalPaid: 0, categories: [] };
  return {
    month: '2026-11',
    asOf: '2026-11-03',
    monthly: {
      from: '2026-10',
      to: '2026-11',
      months: [
        { month: '2026-10', totalExpense: 410.2, expenseCount: 12, totalPaid: 410.2 },
        { month: '2026-11', totalExpense: 312.4, expenseCount: 9, totalPaid: 1112.4 },
      ],
    },
    categoriesFor: () => empty,
    ...overrides,
  };
}

const row = (day: string, total: string, paid: string, count = 1): DailyRow => ({
  day,
  total,
  paid,
  count: String(count),
});

describe('buildInsights', () => {
  it('compares full months, including others’ share', () => {
    const r = buildInsights(input({ daily: [] }));
    assert.deepEqual(r.overview.current, {
      month: '2026-11',
      totalExpense: 312.4,
      totalPaid: 1112.4,
      othersShare: 800,
      expenseCount: 9,
    });
    assert.deepEqual(r.overview.change.totalExpense, { amount: -97.8, percentage: -23.84 });
    assert.deepEqual(r.overview.change.othersShare, { amount: 800, percentage: null });
  });

  it('compares the same elapsed days, ignoring later days', () => {
    const r = buildInsights(
      input({
        daily: [
          row('2026-10-02', '100.10', '100.10'),
          row('2026-10-20', '999.00', '999.00'), // after day 3: not in the same period
          row('2026-11-01', '50.05', '150.15', 2),
        ],
      }),
    );
    assert.deepEqual(r.samePeriod.current, {
      from: '2026-11-01',
      to: '2026-11-03',
      totalExpense: 50.05,
      totalPaid: 150.15,
      othersShare: 100.1,
      expenseCount: 2,
    });
    assert.equal(r.samePeriod.previous.totalExpense, 100.1);
    assert.deepEqual(r.samePeriod.change.totalExpense, { amount: -50.05, percentage: -50 });
  });

  it('zero-fills every day of the month', () => {
    const r = buildInsights(input({ daily: [row('2026-11-02', '10.00', '10.00')] }));
    assert.equal(r.trends.daily.length, 30);
    assert.deepEqual(r.trends.daily[0], {
      date: '2026-11-01',
      totalExpense: 0,
      totalPaid: 0,
      othersShare: 0,
      expenseCount: 0,
    });
    assert.equal(r.trends.daily[1].totalExpense, 10);
  });

  it('builds 12 weeks and Monday-Sunday weekday totals', () => {
    const r = buildInsights(
      input({
        daily: [
          row('2026-08-10', '12.00', '12.00'), // Monday, first day of the range
          row('2026-10-26', '24.00', '30.00'), // Monday, last week
          row('2026-11-01', '7.00', '7.00'), // Sunday, last day of the range
          row('2026-11-02', '500.00', '500.00'), // Monday of the unfinished week: left out
        ],
      }),
    );
    const { weekly } = r.trends;
    assert.equal(weekly.weeks.length, 12);
    assert.deepEqual([weekly.weeks[0].weekStart, weekly.weeks[11].weekEnd], ['2026-08-10', '2026-11-01']);
    assert.equal(weekly.weeks[0].totalExpense, 12);
    assert.equal(weekly.weeks[11].totalExpense, 31);
    assert.deepEqual(
      weekly.weekdays.map((d) => d.weekday),
      [1, 2, 3, 4, 5, 6, 7],
    );
    assert.equal(weekly.weekdays[0].totalExpense, 36);
    assert.equal(weekly.weekdays[0].othersShare, 6);
    assert.equal(weekly.weekdays[0].averageExpense, 3); // 36 / 12 weeks
    assert.equal(weekly.weekdays[6].totalExpense, 7);
  });

  it('compares categories over full months and the same period', () => {
    const category = (id: string, name: string, totalExpense: number, percentage = 0) => ({
      id,
      name,
      totalExpense,
      totalPaid: totalExpense,
      expenseCount: totalExpense > 0 ? 1 : 0,
      percentage,
    });
    const byRange: Record<string, ReturnType<typeof category>[]> = {
      '2026-11-01|2026-11-30': [category('food', 'Food', 118, 70), category('rent', 'Rent', 50, 30), category('gym', 'Gym', 0)],
      '2026-10-01|2026-10-31': [category('food', 'Food', 100), category('rent', 'Rent', 0), category('gym', 'Gym', 0)],
      '2026-11-01|2026-11-03': [category('food', 'Food', 18), category('rent', 'Rent', 0), category('gym', 'Gym', 0)],
      '2026-10-01|2026-10-03': [category('food', 'Food', 9), category('rent', 'Rent', 0), category('gym', 'Gym', 0)],
    };
    const r = buildInsights(
      input({
        daily: [],
        categoriesFor: (range) => ({
          from: range.from,
          to: range.to,
          totalExpense: 0,
          totalPaid: 0,
          categories: byRange[`${range.from}|${range.to}`],
        }),
      }),
    );

    assert.deepEqual(r.categories.highest, { id: 'food', name: 'Food', totalExpense: 118, percentage: 70 });
    assert.deepEqual(r.categories.top.map((c) => c.id), ['food', 'rent']);
    // Gym has no spending in either month and is left out.
    assert.deepEqual(r.categories.items.map((c) => c.id), ['food', 'rent']);
    const [food, rent] = r.categories.items;
    assert.deepEqual(food.fullMonth, { previousTotalExpense: 100, change: { amount: 18, percentage: 18 } });
    assert.deepEqual(food.samePeriod, {
      totalExpense: 18,
      previousTotalExpense: 9,
      change: { amount: 9, percentage: 100 },
    });
    assert.equal(rent.fullMonth.change.percentage, null); // nothing last month
  });

  it('handles a user with no expenses', () => {
    const r = buildInsights(
      input({
        daily: [],
        monthly: {
          from: '2026-10',
          to: '2026-11',
          months: [
            { month: '2026-10', totalExpense: 0, expenseCount: 0, totalPaid: 0 },
            { month: '2026-11', totalExpense: 0, expenseCount: 0, totalPaid: 0 },
          ],
        },
      }),
    );
    assert.deepEqual(r.overview.change.totalExpense, { amount: 0, percentage: null });
    assert.equal(r.samePeriod.current.totalExpense, 0);
    assert.equal(r.categories.highest, null);
    assert.deepEqual(r.categories.items, []);
  });
});
