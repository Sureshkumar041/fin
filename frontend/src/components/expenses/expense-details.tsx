'use client';

import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Badge, Button, Spinner } from '@/components/ui';
import { expensesApi, toFormErrors } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDate, formatMoney, formatTimestampDate } from '@/lib/format';
import { SETTLEMENT_STATUS_LABELS, SPLIT_METHOD_LABELS } from '@/lib/split';
import type { Expense, ExpenseParticipant, SettlementStatus } from '@/types';

type ExpenseDetailsProps = {
  expense: Expense;
  /** Gets the expense the API returned after a settlement (the parent stores it). */
  onUpdated: (expense: Expense) => void;
  onEdit: () => void;
  onClose: () => void;
};

// One expense and its split, with settlement actions per participant.
// Everything shown comes from the expense as the API returned it; nothing is
// recalculated here, and a settlement shows the API's response, not a guess.
export function ExpenseDetails({ expense, onUpdated, onEdit, onClose }: ExpenseDetailsProps) {
  const { split } = expense;
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [error, setError] = useState<{ participantId: string; message: string } | null>(null);
  // Guards against repeated clicks landing before the disabled state renders.
  const inFlight = useRef(false);

  async function settle(participant: ExpenseParticipant, status: SettlementStatus) {
    if (inFlight.current) return;
    inFlight.current = true;
    setSettlingId(participant.id);
    setError(null);
    try {
      onUpdated(await expensesApi.settleParticipant(expense.id, participant.id, status));
    } catch (err) {
      // Keep what is shown (the backend may have rejected a stale request, 409): no local guess.
      setError({ participantId: participant.id, message: toFormErrors(err).message });
    } finally {
      inFlight.current = false;
      setSettlingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium break-words text-foreground">{expense.description ?? 'No description'}</p>
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge>{expense.category.name}</Badge>
          {formatDate(expense.expenseDate)}
        </p>
      </div>

      <Section title="Expense">
        <Row label="Full amount paid" value={formatMoney(expense.amount)} />
        {split && (
          <Row
            label={split.ownPercentage !== null ? `Your share (${split.ownPercentage}%)` : 'Your share'}
            value={formatMoney(split.ownShare)}
            strong
          />
        )}
      </Section>

      {split && (
        <>
          <Section title="Split">
            <Row label="Method" value={SPLIT_METHOD_LABELS[split.method]} />
            <Row label="Others’ share" value={formatMoney(split.othersShare)} />
            <Row label="Owed to you" value={formatMoney(split.owedToYou)} />
            <Row label="Settled to you" value={formatMoney(split.settledToYou)} />
          </Section>

          <Section title="People">
            <ul className="flex flex-col divide-y divide-border">
              {split.participants.map((p) => (
                <ParticipantRow
                  key={p.id}
                  participant={p}
                  settling={settlingId === p.id}
                  // One settlement at a time, so each response is applied in order.
                  disabled={settlingId !== null && settlingId !== p.id}
                  error={error?.participantId === p.id ? error.message : undefined}
                  onSettle={(status) => settle(p, status)}
                />
              ))}
            </ul>
          </Section>
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>Edit expense</Button>
      </div>
    </div>
  );
}

type ParticipantRowProps = {
  participant: ExpenseParticipant;
  settling: boolean;
  disabled: boolean;
  error?: string;
  onSettle: (status: SettlementStatus) => void;
};

function ParticipantRow({ participant: p, settling, disabled, error, onSettle }: ParticipantRowProps) {
  const paid = p.status === 'PAID';
  const name = p.contact.name;
  return (
    <li className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-foreground" title={name}>
            {name}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {p.percentage !== null && `${p.percentage}% · `}
            {formatMoney(p.shareAmount)}
            {paid && p.settledAt && ` · paid ${formatTimestampDate(p.settledAt)}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge variant={paid ? 'success' : 'warning'}>{SETTLEMENT_STATUS_LABELS[p.status]}</Badge>
          {/* While saving, the button stays focusable (aria-disabled, not disabled) so keyboard
              focus isn't lost; repeated presses are ignored by the in-flight guard. */}
          <Button
            variant="secondary"
            size="sm"
            disabled={disabled}
            aria-disabled={settling || undefined}
            aria-busy={settling || undefined}
            aria-label={`Mark ${name} as ${paid ? 'pending' : 'paid'}`}
            onClick={() => onSettle(paid ? 'PENDING' : 'PAID')}
            className={cn(settling && 'cursor-wait opacity-50')}
          >
            {settling && <Spinner />}
            {paid ? 'Mark as pending' : 'Mark as paid'}
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </li>
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

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('tabular-nums', strong ? 'font-medium text-foreground' : 'text-foreground')}>{value}</span>
    </div>
  );
}
