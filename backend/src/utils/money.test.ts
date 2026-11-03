import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { moneyChange, percentChange, percentOf, sumMoney, toMoney } from './money';

describe('toMoney', () => {
  it('converts Postgres numeric strings', () => {
    assert.equal(toMoney('1234.50'), 1234.5);
    assert.equal(toMoney('0'), 0);
  });
});

describe('sumMoney', () => {
  it('adds in paise without floating-point noise', () => {
    assert.equal(sumMoney(['0.1', '0.2']), 0.3);
    assert.equal(sumMoney([]), 0);
  });
});

describe('percentChange', () => {
  it('returns null when there is nothing to compare against', () => {
    assert.equal(percentChange(100, 0), null);
    assert.equal(percentChange(0, 0), null);
  });

  it('calculates increases and decreases', () => {
    assert.equal(percentChange(118, 100), 18);
    assert.equal(percentChange(50, 100), -50);
    assert.equal(percentChange(0, 100), -100);
    assert.equal(percentChange(100, 100), 0);
  });

  it('rounds to 2 decimal places, half away from zero', () => {
    assert.equal(percentChange(312.4, 410.2), -23.84); // -23.8420...
    assert.equal(percentChange(2, 3), -33.33); // -33.333...
    assert.equal(percentChange(1, 3), -66.67); // -66.666...
    assert.equal(percentChange(0.33, 0.32), 3.13); // +3.125 exactly -> 3.13
    assert.equal(percentChange(0.31, 0.32), -3.13); // -3.125 exactly -> -3.13
  });

  it('is exact on amounts too large for Number arithmetic', () => {
    // 9,999,999,999.99 is the largest NUMERIC(12,2); paise x 10000 passes 2^53.
    assert.equal(percentChange(9999999999.99, 0.01), 99999999999800);
    assert.equal(percentChange(0.01, 9999999999.99), -100);
  });
});

describe('percentOf', () => {
  it('returns a part as a percentage of the whole, to 2 decimal places', () => {
    assert.equal(percentOf(203.5, 818), 24.88); // 24.877...
    assert.equal(percentOf(818, 818), 100);
    assert.equal(percentOf(0, 818), 0);
  });

  it('returns null for a zero whole', () => {
    assert.equal(percentOf(0, 0), null);
  });
});

describe('moneyChange', () => {
  it('returns the difference in exact money and its percentage', () => {
    assert.deepEqual(moneyChange(0.3, 0.1), { amount: 0.2, percentage: 200 });
    assert.deepEqual(moneyChange(312.4, 410.2), { amount: -97.8, percentage: -23.84 });
    assert.deepEqual(moneyChange(25, 0), { amount: 25, percentage: null });
  });
});
