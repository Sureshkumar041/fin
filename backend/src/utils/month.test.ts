import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addDays, addMonths, daysInMonth, isoWeekday, startOfIsoWeek } from './month';

describe('addMonths', () => {
  it('crosses year boundaries', () => {
    assert.equal(addMonths('2026-01', -2), '2025-11');
    assert.equal(addMonths('2026-12', 1), '2027-01');
  });
});

describe('daysInMonth', () => {
  it('handles month lengths and leap years', () => {
    assert.equal(daysInMonth('2026-11'), 30);
    assert.equal(daysInMonth('2026-12'), 31);
    assert.equal(daysInMonth('2026-02'), 28);
    assert.equal(daysInMonth('2028-02'), 29);
    assert.equal(daysInMonth('2100-02'), 28);
  });
});

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    assert.equal(addDays('2026-03-01', -1), '2026-02-28');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(addDays('2026-11-03', -83), '2026-08-12');
  });
});

describe('isoWeekday / startOfIsoWeek', () => {
  it('numbers Monday 1 to Sunday 7', () => {
    assert.equal(isoWeekday('2026-11-02'), 1); // Monday
    assert.equal(isoWeekday('2026-11-08'), 7); // Sunday
  });

  it('finds the Monday on or before a date', () => {
    assert.equal(startOfIsoWeek('2026-11-02'), '2026-11-02');
    assert.equal(startOfIsoWeek('2026-11-04'), '2026-11-02');
    assert.equal(startOfIsoWeek('2026-11-08'), '2026-11-02');
    assert.equal(startOfIsoWeek('2027-01-01'), '2026-12-28'); // across a year
  });
});
