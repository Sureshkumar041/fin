import { z } from 'zod';
import { isoDate, yearMonth } from './common.validator';

// "month" lets the client say which month is "current" for the user. The
// server's clock may be in a different timezone (e.g. it's already October
// in India while still September on a UTC server). Defaults to the server's month.
export const summaryQuerySchema = z.object({
  month: yearMonth.optional(),
});

const MONTHS_MSG = 'months must be a whole number between 1 and 36';

export const monthlyQuerySchema = z.object({
  month: yearMonth.optional(), // last month of the range (inclusive)
  months: z.coerce.number(MONTHS_MSG).int(MONTHS_MSG).min(1, MONTHS_MSG).max(36, MONTHS_MSG).default(12),
});

export const categoriesQuerySchema = z
  .object({
    from: isoDate.optional(),
    to: isoDate.optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: '"from" must be on or before "to"',
    path: ['from'],
  });

export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
export type MonthlyQuery = z.infer<typeof monthlyQuerySchema>;
export type CategoriesQuery = z.infer<typeof categoriesQuerySchema>;
