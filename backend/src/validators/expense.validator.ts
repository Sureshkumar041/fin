import { z } from 'zod';
import { isoDate } from './common.validator';

// Matches NUMERIC(12,2): up to 10 digits before the point and 2 after.
const MAX_AMOUNT = 9_999_999_999.99;

const amount = z
  .number('Amount must be a number')
  .positive('Amount must be greater than 0')
  .max(MAX_AMOUNT, 'Amount is too large')
  .refine((v) => /^-?\d+(\.\d{1,2})?$/.test(String(v)), 'Amount can have at most 2 decimal places');

const date = isoDate;

// Empty/whitespace-only descriptions are stored as null.
const description = z
  .string()
  .trim()
  .max(255, 'Description must be at most 255 characters')
  .transform((v) => (v === '' ? null : v))
  .nullable();

export const createExpenseSchema = z.object({
  amount,
  categoryId: z.uuid('Invalid categoryId'),
  expenseDate: date,
  description: description.optional().default(null),
});

export const updateExpenseSchema = z
  .object({
    amount: amount.optional(),
    categoryId: z.uuid('Invalid categoryId').optional(),
    expenseDate: date.optional(),
    description: description.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update');

const PAGE_MSG = 'page must be a whole number of 1 or more';
const LIMIT_MSG = 'limit must be a whole number between 1 and 100';

export const listExpensesQuerySchema = z
  .object({
    page: z.coerce.number(PAGE_MSG).int(PAGE_MSG).min(1, PAGE_MSG).default(1),
    limit: z.coerce.number(LIMIT_MSG).int(LIMIT_MSG).min(1, LIMIT_MSG).max(100, LIMIT_MSG).default(20),
    categoryId: z.uuid('Invalid categoryId').optional(),
    from: date.optional(),
    to: date.optional(),
    search: z.string().trim().min(1).max(100, 'search must be at most 100 characters').optional(),
  })
  // Both are YYYY-MM-DD, so plain string comparison orders them correctly.
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: '"from" must be on or before "to"',
    path: ['from'],
  });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
