// Helpers for "YYYY-MM" month strings and "YYYY-MM-DD" date strings. Plain
// integer arithmetic, or Date only in UTC, so there are no timezone surprises
// from the server's clock.

export function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// addMonths('2026-01', -2) === '2025-11'
export function addMonths(month: string, count: number): string {
  const [year, mon] = month.split('-').map(Number);
  const index = year * 12 + (mon - 1) + count;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

// Today on the server's clock, as 'YYYY-MM-DD' (the same clock as currentMonth()).
export function currentDate(now = new Date()): string {
  return `${currentMonth(now)}-${String(now.getDate()).padStart(2, '0')}`;
}

// firstDay('2026-09') === '2026-09-01'
export const firstDay = (month: string) => `${month}-01`;

// daysInMonth('2028-02') === 29 (day 0 of the next month is the last day of this one)
export function daysInMonth(month: string): number {
  const [year, mon] = month.split('-').map(Number);
  return new Date(Date.UTC(year, mon, 0)).getUTCDate();
}

// lastDay('2026-02') === '2026-02-28'
export const lastDay = (month: string) => `${month}-${String(daysInMonth(month)).padStart(2, '0')}`;

const DAY_MS = 24 * 60 * 60 * 1000;

const toUtc = (date: string) => {
  const [year, mon, day] = date.split('-').map(Number);
  return Date.UTC(year, mon - 1, day);
};

// addDays('2026-03-01', -1) === '2026-02-28'
export const addDays = (date: string, count: number) =>
  new Date(toUtc(date) + count * DAY_MS).toISOString().slice(0, 10);

// ISO weekday: 1 = Monday ... 7 = Sunday.
export const isoWeekday = (date: string) => ((new Date(toUtc(date)).getUTCDay() + 6) % 7) + 1;

// The Monday on or before the date: startOfIsoWeek('2026-11-04') === '2026-11-02'
export const startOfIsoWeek = (date: string) => addDays(date, 1 - isoWeekday(date));
