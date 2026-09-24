import type { IsoDateTime } from './api';

// Split expenses (see backend split.validator.ts / expense.service.ts).

export type SplitMethod = 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';

export type SettlementStatus = 'PENDING' | 'PAID';

/**
 * One other person on a split. You (the payer) are never listed: your own
 * share is always the amount minus the participants' shares. Each method
 * takes exactly one kind of input per participant.
 */
export type EqualParticipantInput = { contactId: string };
export type CustomParticipantInput = { contactId: string; shareAmount: number };
export type PercentageParticipantInput = { contactId: string; percentage: number };

export type SplitParticipantInput =
  | EqualParticipantInput
  | CustomParticipantInput
  | PercentageParticipantInput;

/** Body of `split` on POST /expenses, and of PUT /expenses/:id/split. */
export type SplitInput =
  | { method: 'EQUAL'; participants: EqualParticipantInput[] }
  | { method: 'CUSTOM'; participants: CustomParticipantInput[] }
  | { method: 'PERCENTAGE'; participants: PercentageParticipantInput[] };

export type ExpenseParticipant = {
  /** Participant id: use this (not the contact id) to settle a share. */
  id: string;
  contact: { id: string; name: string };
  shareAmount: number;
  /** Set for PERCENTAGE splits only. */
  percentage: number | null;
  status: SettlementStatus;
  /** When the share was marked PAID; null while PENDING. */
  settledAt: IsoDateTime | null;
};

/** The split of an expense. All totals are calculated by the backend. */
export type ExpenseSplit = {
  method: SplitMethod;
  /** Your own share: the expense amount minus all participant shares. */
  ownShare: number;
  /** Your percentage; null unless the method is PERCENTAGE. */
  ownPercentage: number | null;
  /** Sum of all participant shares. */
  othersShare: number;
  /** Sum of PENDING participant shares. */
  owedToYou: number;
  /** Sum of PAID participant shares. */
  settledToYou: number;
  /** Sorted by contact name. */
  participants: ExpenseParticipant[];
};

/** Body of PATCH /expenses/:id/split/participants/:participantId. */
export type SettlementInput = { status: SettlementStatus };
