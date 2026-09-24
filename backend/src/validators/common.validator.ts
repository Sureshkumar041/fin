import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.uuid('Invalid id'),
});

// "YYYY-MM-DD", and a real calendar date (rejects 2026-02-30).
export const isoDate = z.iso.date('Date must be a valid date in YYYY-MM-DD format');

// "YYYY-MM", e.g. "2026-09".
export const yearMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be in YYYY-MM format');
