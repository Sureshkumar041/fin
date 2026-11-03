import { cn } from '@/lib/cn';
import { formatMoney, formatPercent } from '@/lib/format';
import type { InsightMoneyChange } from '@/types';

type MoneyChangeProps = {
  /** From the API: current minus previous, and its percentage. */
  change: InsightMoneyChange;
  /** The previous period, short: "Oct" or "1–3 Oct 2026". */
  previousLabel: string;
  /** What the row counts, for "no spending in Oct (new)". Without it: "nothing in Oct (new)". */
  noun?: string;
  /**
   * Colour the change: for your spending, up is bad (red) and down is good
   * (green), like the dashboard. Total paid and others' share stay neutral.
   */
  colored?: boolean;
};

/**
 * "▲ ₹1,200.00 · 12.5% more". Shows the backend's numbers as they are; the
 * arrow and words carry the direction, so it never relies on colour alone.
 */
export function MoneyChange({ change, previousLabel, noun, colored = false }: MoneyChangeProps) {
  const { amount, percentage } = change;
  if (amount === 0) return <span className="text-muted-foreground">No change</span>;

  const up = amount > 0;
  const money = formatMoney(Math.abs(amount));
  // null: the previous value was 0, so there's no percentage to show.
  if (percentage === null) {
    return (
      <span className="text-foreground">
        {up ? '+' : '−'}
        {money} <span className="text-muted-foreground">· {noun ? `no ${noun}` : 'nothing'} in {previousLabel} (new)</span>
      </span>
    );
  }

  // A real change too small for a whole percent isn't "0%".
  const percent = Math.abs(percentage) < 0.5 ? '<1%' : formatPercent(percentage);
  // In a narrow column, wrap only between the amount and the percentage,
  // never inside "▲ ₹100.00" or "14% more".
  return (
    <span className={cn('font-medium', colored ? (up ? 'text-danger' : 'text-success') : 'text-foreground')}>
      <span className="whitespace-nowrap">
        <span aria-hidden>{up ? '▲' : '▼'}</span> {money}
      </span>{' '}
      · <span className="whitespace-nowrap">{percent} {up ? 'more' : 'less'}</span>
    </span>
  );
}
