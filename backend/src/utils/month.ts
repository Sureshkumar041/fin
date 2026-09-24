// Helpers for "YYYY-MM" month strings. Plain integer arithmetic, so there are
// no timezone surprises from JavaScript Date objects.

export function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// addMonths('2026-01', -2) === '2025-11'
export function addMonths(month: string, count: number): string {
  const [year, mon] = month.split('-').map(Number);
  const index = year * 12 + (mon - 1) + count;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

// firstDay('2026-09') === '2026-09-01'
export const firstDay = (month: string) => `${month}-01`;
