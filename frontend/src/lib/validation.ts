import type { FieldErrors } from '@/lib/api';
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
