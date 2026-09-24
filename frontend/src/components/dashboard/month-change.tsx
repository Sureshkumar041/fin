import { formatMonth } from '@/lib/format';
import type { MonthlyTotal } from '@/types';

/**
 * "▲ 12% vs Aug" under the current-month tile. For spending, up is bad:
 * increases are red, decreases green, and the arrow + words carry the
 * meaning too, so it never relies on colour alone.
 */
export function MonthChange({ current, previous }: { current: MonthlyTotal; previous: MonthlyTotal }) {
  const prevLabel = formatMonth(previous.month);
  if (previous.totalExpense === 0) {
    return <span>No spending in {prevLabel}</span>;
  }
  const change = ((current.totalExpense - previous.totalExpense) / previous.totalExpense) * 100;
  const rounded = Math.round(Math.abs(change));
  if (rounded === 0) return <span>Same as {prevLabel}</span>;

  const up = change > 0;
  return (
    <span>
      <span className={up ? 'font-medium text-danger' : 'font-medium text-success'}>
        <span aria-hidden>{up ? '▲' : '▼'}</span> {rounded}% {up ? 'more' : 'less'}
      </span>{' '}
      than {prevLabel}
    </span>
  );
}
