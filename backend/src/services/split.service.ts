import type { SplitMethod } from '../entities/expense.entity';
import type { SettlementStatus } from '../entities/expense-participant.entity';
import { contactRepository } from '../repositories/contact.repository';
import { HttpError } from '../utils/http-error';
import { fromPaise, toPaise } from '../utils/money';
import type { SplitInput } from '../validators/split.validator';

// Business rules for split expenses: share calculation, the owner's derived
// share, settlement, and when a split may change. No HTTP and no persistence
// of its own, so expenseService and the split routes can both use it.
//
// Money is calculated in integer paise and percentages in basis points
// (100% = 10000), never in floating-point rupees. Inputs are already validated
// to at most 2 decimal places, so converting them is exact.

export type SplitParticipant = {
  contactId: string;
  shareAmount: number;
  percentage: number | null;
  status: SettlementStatus;
  settledAt: Date | null;
};

// Everything an expense response needs. Participants are passed through
// as given, so callers can hand in entities with their contact loaded.
export type SplitSummary<P extends SplitParticipant = SplitParticipant> = {
  method: SplitMethod;
  ownShare: number;
  ownPercentage: number | null; // PERCENTAGE splits only
  othersShare: number; // sum of all participant shares
  owedToYou: number; // PENDING shares
  settledToYou: number; // PAID shares
  participants: P[];
};

const toBasisPoints = (percentage: number) => Math.round(percentage * 100);
const formatPaise = (paise: number) => (paise / 100).toFixed(2);
const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

// Same shape as the existing "categoryId not found" validation error.
const validationError = (field: string, messages: string[]) =>
  new HttpError(400, 'Validation failed', { [field]: messages });

// Every person, the owner included, gets the same whole number of paise;
// the owner also takes the leftover paise.
function equalShares(amountPaise: number, participantCount: number): number[] {
  const people = participantCount + 1;
  if (amountPaise < people) {
    throw validationError('participants', [
      `${formatPaise(amountPaise)} is too small to split equally between ${people} people; each needs at least 0.01`,
    ]);
  }
  return Array(participantCount).fill(Math.floor(amountPaise / people));
}

function checkCustomShares(amountPaise: number, sharesPaise: number[]): number[] {
  const total = sum(sharesPaise);
  if (total > amountPaise) {
    throw validationError('participants', [
      `Participant shares (${formatPaise(total)}) exceed the expense amount (${formatPaise(amountPaise)})`,
    ]);
  }
  return sharesPaise;
}

// Each share is rounded down, so the shares can never add up to more than the
// amount. The leftover paise go to the owner, or to the last participant when
// the participants cover 100% (the owner's 0% must stay exactly 0).
function percentageShares(amountPaise: number, basisPoints: number[]): number[] {
  const totalBasisPoints = sum(basisPoints);
  if (totalBasisPoints > 10000) {
    throw validationError('participants', [
      `Participant percentages add up to ${totalBasisPoints / 100}, which is more than 100`,
    ]);
  }

  // amount x basis points can pass Number.MAX_SAFE_INTEGER at the maximum
  // amount, so multiply as BigInt.
  const shares = basisPoints.map((bp) => Number((BigInt(amountPaise) * BigInt(bp)) / 10000n));
  if (totalBasisPoints === 10000) {
    shares[shares.length - 1] += amountPaise - sum(shares);
  }

  const tooSmall = shares.flatMap((share, i) =>
    share < 1
      ? [`Participant ${i + 1}: ${basisPoints[i] / 100}% of ${formatPaise(amountPaise)} is less than 0.01`]
      : [],
  );
  if (tooSmall.length > 0) throw validationError('participants', tooSmall);
  return shares;
}

function summarize<P extends SplitParticipant>(amount: number, method: SplitMethod, participants: P[]): SplitSummary<P> {
  const sharesOf = (status?: SettlementStatus) =>
    sum(participants.filter((p) => !status || p.status === status).map((p) => toPaise(p.shareAmount)));
  const othersPaise = sharesOf();

  return {
    method,
    ownShare: fromPaise(toPaise(amount) - othersPaise),
    ownPercentage:
      method === 'PERCENTAGE'
        ? (10000 - sum(participants.map((p) => toBasisPoints(p.percentage ?? 0)))) / 100
        : null,
    othersShare: fromPaise(othersPaise),
    owedToYou: fromPaise(sharesOf('PENDING')),
    settledToYou: fromPaise(sharesOf('PAID')),
    participants,
  };
}

// Amounts, shares and the split itself are frozen once anyone has paid, so a
// recorded settlement can never silently stop matching its share.
function assertNotSettled(participants: SplitParticipant[]) {
  if (participants.some((p) => p.status === 'PAID')) {
    throw new HttpError(
      409,
      'This split has settled participants; mark them as pending before changing the split or the amount',
    );
  }
}

export const splitService = {
  summarize,
  assertNotSettled,

  // Shares for a new split (all PENDING). `input` has passed splitInputSchema;
  // this adds the rules that depend on the amount.
  calculate(amount: number, input: SplitInput): SplitSummary {
    const amountPaise = toPaise(amount);
    const { method } = input;

    let sharesPaise: number[];
    if (method === 'EQUAL') {
      sharesPaise = equalShares(amountPaise, input.participants.length);
    } else if (method === 'CUSTOM') {
      sharesPaise = checkCustomShares(amountPaise, input.participants.map((p) => toPaise(p.shareAmount!)));
    } else {
      sharesPaise = percentageShares(amountPaise, input.participants.map((p) => toBasisPoints(p.percentage!)));
    }

    const participants: SplitParticipant[] = input.participants.map((p, i) => ({
      contactId: p.contactId,
      shareAmount: fromPaise(sharesPaise[i]),
      percentage: method === 'PERCENTAGE' ? p.percentage! : null,
      status: 'PENDING',
      settledAt: null,
    }));
    return summarize(amount, method, participants);
  },

  // Every contact must be one of the user's own. Other users' contacts look
  // exactly like ids that don't exist.
  async ensureContactsOwned(contactIds: string[], userId: string) {
    const owned = await contactRepository.findOwnedIds(contactIds, userId);
    const missing = contactIds.flatMap((id, i) => (owned.has(id) ? [] : [`Participant ${i + 1}: contact not found`]));
    if (missing.length > 0) throw validationError('participants', missing);
  },

  // Ownership check plus calculation: what creating or replacing a split needs.
  // Callers replacing an existing split must call assertNotSettled first.
  async build(amount: number, input: SplitInput, userId: string): Promise<SplitSummary> {
    await this.ensureContactsOwned(input.participants.map((p) => p.contactId), userId);
    return this.calculate(amount, input);
  },

  // New shares after the expense amount changes (call only when it actually
  // changes). EQUAL is re-divided, PERCENTAGE keeps its percentages, CUSTOM
  // keeps its shares and the owner absorbs the difference.
  recalculateForAmount<P extends SplitParticipant>(
    newAmount: number,
    method: SplitMethod,
    participants: P[],
  ): SplitSummary<P> {
    assertNotSettled(participants);
    const amountPaise = toPaise(newAmount);

    let sharesPaise: number[];
    if (method === 'EQUAL') {
      sharesPaise = equalShares(amountPaise, participants.length);
    } else if (method === 'PERCENTAGE') {
      sharesPaise = percentageShares(amountPaise, participants.map((p) => toBasisPoints(p.percentage ?? 0)));
    } else {
      sharesPaise = participants.map((p) => toPaise(p.shareAmount));
      const total = sum(sharesPaise);
      if (total > amountPaise) {
        throw validationError('amount', [
          `Amount can't be less than the participants' shares (${formatPaise(total)})`,
        ]);
      }
    }

    const updated = participants.map((p, i) => ({ ...p, shareAmount: fromPaise(sharesPaise[i]) }));
    return summarize(newAmount, method, updated);
  },

  // Whole-share settlement only. Marking a participant with the status they
  // already have changes nothing (settledAt is kept, not reset). The expense
  // amount is never touched.
  settle<P extends SplitParticipant & { id: string }>(
    participants: P[],
    participantId: string,
    status: SettlementStatus,
    now: Date = new Date(),
  ): P {
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) {
      // Not a participant of this expense (or the expense isn't the user's).
      throw new HttpError(404, 'Participant not found');
    }
    if (participant.status === status) return participant;
    return { ...participant, status, settledAt: status === 'PAID' ? now : null };
  },
};
