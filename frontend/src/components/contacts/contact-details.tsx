'use client';

import type { ReactNode } from 'react';
import { Badge, Button, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { ReceiptIcon } from '@/components/icons';
import { useApi } from '@/hooks/use-api';
import { contactsApi } from '@/lib/api';
import { formatDate, formatMoney, formatTimestampDate } from '@/lib/format';
import { SETTLEMENT_STATUS_LABELS, SPLIT_METHOD_LABELS } from '@/lib/split';
import type { Contact, ContactExpense } from '@/types';

type ContactDetailsProps = {
  contact: Contact;
  onClose: () => void;
};

// A contact's split expenses with their share of each, loaded in one request
// when the dialog opens. Every amount and total comes from the API as-is;
// nothing is summed or recalculated here.
export function ContactDetails({ contact, onClose }: ContactDetailsProps) {
  const details = useApi(() => contactsApi.expenses(contact.id), [contact.id]);
  const data = details.data;
  // The API sorts newest first; splitting by status keeps that order.
  const pending = data?.expenses.filter((e) => e.status === 'PENDING') ?? [];
  const paid = data?.expenses.filter((e) => e.status === 'PAID') ?? [];

  return (
    <div className="flex flex-col gap-5">
      {details.loading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-16 w-full" />
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : details.error && !data ? (
        <ErrorState message={details.error.message} onRetry={details.reload} retrying={details.refreshing} />
      ) : data && data.expenses.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon />}
          title="No split expenses"
          description={`${contact.name} isn’t part of any split expense yet. Add them to a split from the Expenses page.`}
        />
      ) : (
        data && (
          <>
            <dl className="grid grid-cols-3 gap-2">
              <Stat label="Pending" value={formatMoney(data.summary.pendingTotal)} strong />
              <Stat label="Settled" value={formatMoney(data.summary.settledTotal)} />
              <Stat label="Total share" value={formatMoney(data.summary.shareTotal)} />
            </dl>
            <p className="-mt-2 text-xs text-muted-foreground">
              Across {data.expenses.length} {data.expenses.length === 1 ? 'expense' : 'expenses'} totalling{' '}
              <span className="tabular-nums">{formatMoney(data.summary.expensesTotal)}</span>. Only {contact.name}’s
              share is counted, never yours.
            </p>

            <Section title={`Pending (${data.summary.pendingCount})`}>
              <ExpenseRows expenses={pending} empty="Nothing pending: all settled up." />
            </Section>
            <Section title={`Paid (${data.summary.settledCount})`}>
              <ExpenseRows expenses={paid} empty="Nothing paid back yet." />
            </Section>
          </>
        )
      )}

      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

function ExpenseRows({ expenses, empty }: { expenses: ContactExpense[]; empty: string }) {
  if (expenses.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ul className="flex flex-col divide-y divide-border">
      {expenses.map((e) => (
        <ExpenseRow key={e.participantId} item={e} />
      ))}
    </ul>
  );
}

function ExpenseRow({ item }: { item: ContactExpense }) {
  const { expense } = item;
  const paid = item.status === 'PAID';
  const title = expense.description ?? expense.category.name;
  return (
    <li className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground" title={title}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatDate(expense.expenseDate)} · {formatMoney(expense.amount)} total ·{' '}
          {SPLIT_METHOD_LABELS[expense.splitMethod]}
          {item.percentage !== null && ` (${item.percentage}%)`}
        </p>
        {paid && item.settledAt && (
          <p className="text-xs text-muted-foreground">Paid {formatTimestampDate(item.settledAt)}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-medium text-foreground tabular-nums">{formatMoney(item.shareAmount)}</span>
        <Badge variant={paid ? 'success' : 'warning'}>{SETTLEMENT_STATUS_LABELS[item.status]}</Badge>
      </div>
    </li>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-border px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={strong ? 'truncate text-sm font-semibold text-foreground tabular-nums' : 'truncate text-sm text-foreground tabular-nums'}>
        {value}
      </dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="border-b border-border pb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}
