import type { ReactNode } from 'react';
import { CheckCircleIcon, ClockIcon, CreditCardIcon } from '@/components/icons';
import { formatMoney } from '@/lib/format';
import { ACCENT_CLASSES, type Accent } from '@/lib/category-color';
import { cn } from '@/lib/cn';
import type { DashboardSummary } from '@/types';

/** Total paid, owed to you and settled, as one card. Every figure is from the summary API. */
export function SharedExpensesCard({ summary: s }: { summary: DashboardSummary }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-card sm:p-6">
      <h2 className="text-base font-semibold tracking-tight">Shared expenses</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
        <Figure
          accent="amber"
          icon={<CreditCardIcon />}
          label="Total paid"
          value={formatMoney(s.totalPaid)}
          footnote={`Incl. others’ shares · ${formatMoney(s.currentMonth.totalPaid)} this month`}
        />
        <Figure accent="pink" icon={<ClockIcon />} label="Owed to you" value={formatMoney(s.owedToYou)} footnote="Shares not paid back yet" />
        <Figure accent="emerald" icon={<CheckCircleIcon />} label="Settled to you" value={formatMoney(s.settledToYou)} footnote="Shares paid back to you" />
      </dl>
    </section>
  );
}

function Figure({ accent, icon, label, value, footnote }: { accent: Accent; icon: ReactNode; label: string; value: string; footnote: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 sm:px-5 sm:first:pl-0 sm:last:pr-0">
      <span aria-hidden className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl text-on-brand [&>svg]:size-4.5', ACCENT_CLASSES[accent].gradient)}>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 text-xl font-semibold tracking-tight break-all text-foreground lg:text-2xl">{value}</dd>
        <dd className="mt-0.5 text-xs text-muted-foreground">{footnote}</dd>
      </div>
    </div>
  );
}
