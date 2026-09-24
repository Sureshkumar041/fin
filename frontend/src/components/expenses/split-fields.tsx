'use client';

import type { ReactNode } from 'react';
import { CloseIcon } from '@/components/icons';
import { Alert, Button, Input, Select, Skeleton } from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { contactsApi, type FieldErrors } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import {
  MAX_SPLIT_PARTICIPANTS,
  previewSplit,
  SPLIT_METHOD_LABELS,
  type SplitFormValues,
  type SplitParticipantFormValues,
} from '@/lib/split';
import { splitRowErrorKey } from '@/lib/validation';
import type { SplitMethod } from '@/types';

/** A small set of mutually exclusive buttons, e.g. Personal / Split. */
export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-lg border border-border bg-muted p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-8 rounded-md px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              selected ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const METHOD_OPTIONS = (Object.keys(SPLIT_METHOD_LABELS) as SplitMethod[]).map((value) => ({
  value,
  label: SPLIT_METHOD_LABELS[value],
}));

type SplitFieldsProps = {
  values: SplitFormValues;
  onChange: (values: SplitFormValues) => void;
  /** The expense amount as typed, for the preview. */
  amount: string;
  errors: FieldErrors;
  disabled?: boolean;
};

// Only mounted in split mode, so contacts load when the user turns splitting on.
export function SplitFields({ values, onChange, amount, errors, disabled }: SplitFieldsProps) {
  const contacts = useApi(() => contactsApi.list());
  const selectedIds = new Set(values.participants.map((p) => p.contactId));
  const available = (contacts.data ?? []).filter((c) => !selectedIds.has(c.id));
  const preview = previewSplit(amount, values);
  const splitError = errors.split ?? errors.participants ?? errors.method;

  function setMethod(method: SplitMethod) {
    if (method === values.method) return;
    // Values typed for one method mean nothing for another: start them fresh.
    onChange({
      ...values,
      method,
      participants: values.participants.map((p) => ({ ...p, shareAmount: '', percentage: '' })),
    });
  }

  function addParticipant(contactId: string) {
    const contact = contacts.data?.find((c) => c.id === contactId);
    if (!contact || selectedIds.has(contactId)) return;
    onChange({
      ...values,
      participants: [...values.participants, { contactId, name: contact.name, shareAmount: '', percentage: '' }],
    });
  }

  function updateParticipant(contactId: string, patch: Partial<SplitParticipantFormValues>) {
    onChange({
      ...values,
      participants: values.participants.map((p) => (p.contactId === contactId ? { ...p, ...patch } : p)),
    });
  }

  function removeParticipant(contactId: string) {
    onChange({ ...values, participants: values.participants.filter((p) => p.contactId !== contactId) });
  }

  const noContacts = contacts.data !== undefined && contacts.data.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Split method</span>
        <ChoiceGroup label="Split method" options={METHOD_OPTIONS} value={values.method} onChange={setMethod} disabled={disabled} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Split with</span>

        {values.participants.length > 0 && (
          <ul className="flex flex-col gap-2">
            {values.participants.map((p, i) => {
              const rowError = errors[splitRowErrorKey(p.contactId)];
              const inputId = `split-${p.contactId}`;
              const share = preview?.sharesPaise[i];
              return (
                <li key={p.contactId} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <label htmlFor={inputId} className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {p.name}
                    </label>
                    {values.method === 'CUSTOM' && (
                      <Input
                        id={inputId}
                        inputMode="decimal"
                        placeholder="0.00"
                        autoComplete="off"
                        aria-label={`${p.name}'s share`}
                        value={p.shareAmount}
                        onChange={(e) => updateParticipant(p.contactId, { shareAmount: e.target.value })}
                        invalid={!!rowError}
                        disabled={disabled}
                        className="w-28 text-right"
                      />
                    )}
                    {values.method === 'PERCENTAGE' && (
                      <>
                        <Input
                          id={inputId}
                          inputMode="decimal"
                          placeholder="0"
                          autoComplete="off"
                          aria-label={`${p.name}'s percentage`}
                          value={p.percentage}
                          onChange={(e) => updateParticipant(p.contactId, { percentage: e.target.value })}
                          invalid={!!rowError}
                          disabled={disabled}
                          className="w-20 text-right"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </>
                    )}
                    {values.method !== 'CUSTOM' && (
                      <span className="w-24 text-right text-sm text-muted-foreground tabular-nums">
                        {share !== undefined ? formatMoney(share / 100) : '–'}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${p.name}`}
                      onClick={() => removeParticipant(p.contactId)}
                      disabled={disabled}
                    >
                      <CloseIcon className="size-4" />
                    </Button>
                  </div>
                  {rowError && <p className="text-sm text-danger">{rowError}</p>}
                </li>
              );
            })}
          </ul>
        )}

        {contacts.loading ? (
          <Skeleton className="h-10 w-full" />
        ) : contacts.error ? (
          <Alert variant="error">
            Couldn’t load your contacts: {contacts.error.message}{' '}
            <Button variant="ghost" size="sm" onClick={contacts.reload} className="ml-1">
              Try again
            </Button>
          </Alert>
        ) : noContacts ? (
          <Alert variant="info">
            You don’t have any contacts yet. Add the people you share expenses with as contacts first, then you can
            split an expense with them.
          </Alert>
        ) : values.participants.length < MAX_SPLIT_PARTICIPANTS && available.length > 0 ? (
          <Select
            aria-label="Add a person to the split"
            value=""
            onChange={(e) => addParticipant(e.target.value)}
            disabled={disabled}
            invalid={!!splitError && values.participants.length === 0}
          >
            <option value="">{values.participants.length === 0 ? 'Choose a person…' : 'Add another person…'}</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        ) : null}

        {splitError && <p className="text-sm text-danger">{splitError}</p>}
      </div>

      {preview && values.participants.length > 0 && (
        <SplitSummary>
          <SummaryRow label="Total expense" value={formatMoney(preview.totalPaise / 100)} />
          <SummaryRow label="Others’ share" value={formatMoney(preview.othersPaise / 100)} />
          <SummaryRow
            label={preview.ownPercentage !== null ? `Your share (${preview.ownPercentage}%)` : 'Your share'}
            value={formatMoney(preview.ownPaise / 100)}
            strong
            danger={preview.ownPaise < 0}
          />
        </SplitSummary>
      )}
    </div>
  );
}

function SplitSummary({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2.5">
      <dl className="flex flex-col gap-1 text-sm">{children}</dl>
      <p className="mt-2 text-xs text-muted-foreground">Final shares are calculated when you save.</p>
    </div>
  );
}

function SummaryRow({ label, value, strong, danger }: { label: string; value: string; strong?: boolean; danger?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('tabular-nums', strong && 'font-medium text-foreground', danger && 'text-danger')}>{value}</dd>
    </div>
  );
}
