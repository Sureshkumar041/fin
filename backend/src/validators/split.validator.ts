import { z } from 'zod';
import { SPLIT_METHODS } from '../entities/expense.entity';
import { SETTLEMENT_STATUSES } from '../entities/expense-participant.entity';

// Shape rules only. Rules that depend on the expense amount or the database
// (share totals, minimum shares, contact ownership) live in split.service.ts.

export const MAX_PARTICIPANTS = 20;

const hasAtMostTwoDecimals = (v: number) => /^\d+(\.\d{1,2})?$/.test(String(v));

// Same limits as the expense amount: NUMERIC(12,2).
const shareAmount = z
  .number('Share amount must be a number')
  .positive('Share amount must be greater than 0')
  .max(9_999_999_999.99, 'Share amount is too large')
  .refine(hasAtMostTwoDecimals, 'Share amount can have at most 2 decimal places');

const percentage = z
  .number('Percentage must be a number')
  .positive('Percentage must be greater than 0')
  .max(100, 'Percentage must be at most 100')
  .refine(hasAtMostTwoDecimals, 'Percentage can have at most 2 decimal places');

const participant = z.object({
  contactId: z.uuid('Invalid contactId'),
  shareAmount: shareAmount.optional(),
  percentage: percentage.optional(),
});

export const splitInputSchema = z
  .object({
    method: z.enum(SPLIT_METHODS, 'method must be EQUAL, CUSTOM or PERCENTAGE'),
    participants: z
      .array(participant, 'participants must be an array')
      .min(1, 'A split needs at least 1 participant')
      .max(MAX_PARTICIPANTS, `A split can have at most ${MAX_PARTICIPANTS} participants`),
  })
  .superRefine(({ method, participants }, ctx) => {
    const issue = (index: number, field: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: ['participants', index, field], message: `Participant ${index + 1}: ${message}` });

    const seen = new Set<string>();
    participants.forEach((p, i) => {
      if (seen.has(p.contactId)) issue(i, 'contactId', 'the same contact is listed more than once');
      seen.add(p.contactId);

      // Each method takes exactly one kind of input per participant.
      if (method === 'CUSTOM' && p.shareAmount === undefined) issue(i, 'shareAmount', 'shareAmount is required for CUSTOM splits');
      if (method === 'PERCENTAGE' && p.percentage === undefined) issue(i, 'percentage', 'percentage is required for PERCENTAGE splits');
      if (method !== 'CUSTOM' && p.shareAmount !== undefined) issue(i, 'shareAmount', `shareAmount is not allowed for ${method} splits`);
      if (method !== 'PERCENTAGE' && p.percentage !== undefined) issue(i, 'percentage', `percentage is not allowed for ${method} splits`);
    });
  });

// PATCH /expenses/:id/split/participants/:participantId
export const participantParamsSchema = z.object({
  id: z.uuid('Invalid id'),
  participantId: z.uuid('Invalid participantId'),
});

export const settlementSchema = z.object({
  status: z.enum(SETTLEMENT_STATUSES, 'status must be PENDING or PAID'),
});

export type SplitInput = z.infer<typeof splitInputSchema>;
export type SettlementInput = z.infer<typeof settlementSchema>;
