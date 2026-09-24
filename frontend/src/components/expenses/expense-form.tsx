'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Alert, Button, FormField, Input, Select } from '@/components/ui';
import { toFormErrors, type FieldErrors } from '@/lib/api';
import { todayIso } from '@/lib/format';
import { initialSplitValues, toSplitInput, type SplitFormValues } from '@/lib/split';
import { splitRowErrorKey, validateExpense, validateSplit, type ExpenseFormValues } from '@/lib/validation';
import type { Category, CreateExpenseInput, Expense } from '@/types';
import { ChoiceGroup, SplitFields } from './split-fields';

type ExpenseFormProps = {
  categories: Category[];
  /** Pass an expense to edit it; omit to create a new one. */
  expense?: Expense;
  /** `split` is only present when the user chose to split the expense. */
  onSubmit: (input: CreateExpenseInput) => Promise<void>;
  onCancel: () => void;
};

function initialValues(expense?: Expense): ExpenseFormValues {
  return {
    amount: expense ? String(expense.amount) : '',
    categoryId: expense?.category.id ?? '',
    expenseDate: expense?.expenseDate ?? todayIso(),
    description: expense?.description ?? '',
  };
}

const EXPENSE_TYPE_OPTIONS = [
  { value: 'personal', label: 'Personal expense' },
  { value: 'split', label: 'Split with others' },
] as const;

// Used for both "Add expense" and "Edit expense".
export function ExpenseForm({ categories, expense, onSubmit, onCancel }: ExpenseFormProps) {
  const [values, setValues] = useState(() => initialValues(expense));
  // The saved split is the source of truth; a personal expense starts as personal.
  const [split, setSplit] = useState<SplitFormValues>(() => initialSplitValues(expense?.split));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: '' }));
  }

  function handleSplitChange(next: SplitFormValues) {
    setSplit(next);
    // Clear split errors (client ones and the API's split/participants/method) as the user edits.
    setErrors((errs) =>
      Object.fromEntries(
        Object.entries(errs).filter(([key]) => !['split', 'participants', 'method'].includes(key) && !key.startsWith(splitRowErrorKey(''))),
      ),
    );
  }

  const settled = expense?.split?.participants.some((p) => p.status === 'PAID') ?? false;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clientErrors = { ...validateExpense(values), ...validateSplit(split, values.amount) };
    setErrors(clientErrors);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        amount: Number(values.amount),
        categoryId: values.categoryId,
        expenseDate: values.expenseDate,
        description: values.description.trim(), // "" clears it; the API stores null
        // Personal expenses send no split at all, exactly as before.
        ...(split.enabled ? { split: toSplitInput(split) } : {}),
      });
    } catch (err) {
      const { fieldErrors, message } = toFormErrors(err);
      setErrors(fieldErrors);
      setFormError(message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError && <Alert variant="error">{formError}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Amount" htmlFor="amount" error={errors.amount}>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="0.00"
            autoComplete="off"
            value={values.amount}
            onChange={handleChange}
            invalid={!!errors.amount}
            disabled={submitting}
            autoFocus
          />
        </FormField>
        <FormField label="Date" htmlFor="expenseDate" error={errors.expenseDate}>
          <Input
            id="expenseDate"
            name="expenseDate"
            type="date"
            value={values.expenseDate}
            onChange={handleChange}
            invalid={!!errors.expenseDate}
            disabled={submitting}
          />
        </FormField>
      </div>

      <FormField label="Category" htmlFor="categoryId" error={errors.categoryId}>
        <Select
          id="categoryId"
          name="categoryId"
          value={values.categoryId}
          onChange={handleChange}
          invalid={!!errors.categoryId}
          disabled={submitting}
        >
          <option value="">Choose a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Description" htmlFor="description" error={errors.description} hint="Optional">
        <Input
          id="description"
          name="description"
          placeholder="e.g. Lunch with team"
          value={values.description}
          onChange={handleChange}
          invalid={!!errors.description}
          disabled={submitting}
          maxLength={255}
        />
      </FormField>

      <fieldset className="flex flex-col gap-3 border-t border-border pt-4">
        <legend className="sr-only">Split</legend>
        <ChoiceGroup
          label="Expense type"
          options={[...EXPENSE_TYPE_OPTIONS]}
          value={split.enabled ? 'split' : 'personal'}
          onChange={(type) => handleSplitChange({ ...split, enabled: type === 'split' })}
          disabled={submitting}
        />
        {settled && (
          <Alert variant="warning">
            Someone has already paid their share, so the amount and the split can’t change until their payment is
            marked as pending again. You can still edit the date, category and description.
          </Alert>
        )}
        {split.enabled && (
          <SplitFields values={split} onChange={handleSplitChange} amount={values.amount} errors={errors} disabled={submitting} />
        )}
      </fieldset>

      <div className="mt-2 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {expense ? 'Save changes' : 'Add expense'}
        </Button>
      </div>
    </form>
  );
}
