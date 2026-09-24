import type { FieldErrors } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { MAX_SPLIT_PARTICIPANTS, parsePaise, previewSplit, type SplitFormValues } from '@/lib/split';
import type { LoginInput, RegisterInput } from '@/types';

// Client-side checks mirror the backend's rules (backend/src/validators/auth.validator.ts)
// so users get instant feedback. The backend still validates everything.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(values: LoginInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address';
  if (!values.password) errors.password = 'Password is required';
  return errors;
}

export type RegisterFormValues = RegisterInput & { confirmPassword: string };

export function validateRegister(values: RegisterFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const name = values.name.trim();
  if (!name) errors.name = 'Name is required';
  else if (name.length > 100) errors.name = 'Name must be at most 100 characters';

  if (!values.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Enter a valid email address';

  if (values.password.length < 8) errors.password = 'Password must be at least 8 characters';
  else if (new TextEncoder().encode(values.password).length > 72) errors.password = 'Password is too long';

  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

// ---- Expenses (mirrors backend/src/validators/expense.validator.ts) ----

/** What the expense form edits. Amount stays a string until submit. */
export type ExpenseFormValues = {
  amount: string;
  categoryId: string;
  expenseDate: string;
  description: string;
};

const MAX_AMOUNT = 9_999_999_999.99;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function validateExpense(values: ExpenseFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const amount = values.amount.trim();

  if (!amount) errors.amount = 'Amount is required';
  else if (!/^\d+(\.\d{1,2})?$/.test(amount)) errors.amount = 'Enter an amount like 250 or 12.50';
  else if (Number(amount) <= 0) errors.amount = 'Amount must be greater than 0';
  else if (Number(amount) > MAX_AMOUNT) errors.amount = 'Amount is too large';

  if (!values.categoryId) errors.categoryId = 'Choose a category';

  if (!values.expenseDate) errors.expenseDate = 'Date is required';
  else if (!DATE_PATTERN.test(values.expenseDate)) errors.expenseDate = 'Enter a valid date';

  if (values.description.trim().length > 255) {
    errors.description = 'Description must be at most 255 characters';
  }
  return errors;
}

// ---- Split (mirrors backend/src/validators/split.validator.ts and split.service.ts) ----

/** Errors for a whole split are under "split"; for one person under "split.<contactId>". */
export const splitRowErrorKey = (contactId: string) => `split.${contactId}`;

export function validateSplit(values: SplitFormValues, amount: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.enabled) return errors;

  const people = values.participants;
  if (people.length === 0) {
    errors.split = 'Choose at least one person to split with';
    return errors;
  }
  if (people.length > MAX_SPLIT_PARTICIPANTS) {
    errors.split = `A split can have at most ${MAX_SPLIT_PARTICIPANTS} people`;
  }
  const ids = people.map((p) => p.contactId);
  if (new Set(ids).size !== ids.length) {
    errors.split = 'The same person is listed more than once';
  }

  for (const p of people) {
    const key = splitRowErrorKey(p.contactId);
    if (values.method === 'CUSTOM') {
      const share = p.shareAmount.trim();
      if (!share) errors[key] = 'Enter a share';
      else if (parsePaise(share) === null) errors[key] = 'Enter an amount like 250 or 12.50';
      else if (Number(share) <= 0) errors[key] = 'Share must be greater than 0';
    } else if (values.method === 'PERCENTAGE') {
      const pct = p.percentage.trim();
      if (!pct) errors[key] = 'Enter a percentage';
      else if (parsePaise(pct) === null) errors[key] = 'Use at most 2 decimals, e.g. 33.33';
      else if (Number(pct) <= 0) errors[key] = 'Percentage must be greater than 0';
      else if (Number(pct) > 100) errors[key] = 'Percentage must be at most 100';
    }
  }

  // Checks against the amount only make sense once the amount itself is valid.
  const preview = previewSplit(amount, values);
  if (!preview || preview.totalPaise <= 0 || errors.split) return errors;
  const hasRowErrors = people.some((p) => errors[splitRowErrorKey(p.contactId)]);

  if (values.method === 'EQUAL' && preview.totalPaise < people.length + 1) {
    errors.split = `${formatMoney(preview.totalPaise / 100)} is too small to split between ${people.length + 1} people`;
  } else if (values.method === 'CUSTOM' && !hasRowErrors && preview.ownPaise < 0) {
    errors.split = `Shares add up to ${formatMoney(preview.othersPaise / 100)}, more than the expense amount (${formatMoney(preview.totalPaise / 100)})`;
  } else if (values.method === 'PERCENTAGE' && !hasRowErrors) {
    if (preview.ownPercentage !== null && preview.ownPercentage < 0) {
      errors.split = `Percentages add up to ${Math.round((100 - preview.ownPercentage) * 100) / 100}%, more than 100%`;
    } else {
      people.forEach((p, i) => {
        if (preview.sharesPaise[i] < 1) errors[splitRowErrorKey(p.contactId)] = 'This share is less than 0.01';
      });
    }
  }
  return errors;
}

// ---- Contacts (mirrors backend/src/validators/contact.validator.ts) ----

export function validateContactName(
  name: string,
  existing: { id: string; name: string }[],
  exceptId?: string,
): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return 'Name is required';
  if (trimmed.length > 100) return 'Name must be at most 100 characters';
  // Quick check against what's loaded; the API makes the final call (409).
  const clash = existing.find((c) => c.id !== exceptId && c.name.toLowerCase() === trimmed.toLowerCase());
  if (clash) return `You already have a contact called “${clash.name}”`;
  return undefined;
}

// ---- Categories (mirrors backend/src/validators/category.validator.ts) ----

export function validateCategoryName(
  name: string,
  existing: { id: string; name: string }[],
  exceptId?: string,
): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return 'Name is required';
  if (trimmed.length > 50) return 'Name must be at most 50 characters';
  // Quick check against what's loaded; the API makes the final call (409).
  const clash = existing.find((c) => c.id !== exceptId && c.name.toLowerCase() === trimmed.toLowerCase());
  if (clash) return `You already have a category called “${clash.name}”`;
  return undefined;
}
