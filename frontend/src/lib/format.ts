import { config } from '@/lib/config';
import type { IsoDate, YearMonth } from '@/types';

const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: config.currency });

export const formatMoney = (amount: number) => money.format(amount);

// Parse "YYYY-MM-DD" as a local date; new Date("2026-09-23") would be UTC
// midnight and can show as the previous day in some timezones.
export function formatDate(date: IsoDate): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Today in the user's timezone, as "YYYY-MM-DD". */
export function todayIso(now = new Date()): IsoDate {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Current month in the user's timezone, as "YYYY-MM". */
export function currentYearMonth(now = new Date()): YearMonth {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

const moneyCompact = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: config.currency,
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Short money for axis ticks: ₹12K, ₹1.2M. */
export const formatMoneyCompact = (amount: number) => moneyCompact.format(amount);

/** "2026-09" -> "Sep" (short) or "September 2026" (long). */
export function formatMonth(month: YearMonth, style: 'short' | 'long' = 'short'): string {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(
    undefined,
    style === 'short' ? { month: 'short' } : { month: 'long', year: 'numeric' },
  );
}

/** First day of the current month in the user's timezone, as "YYYY-MM-01". */
export const monthStartIso = (now = new Date()): IsoDate => `${currentYearMonth(now)}-01`;
