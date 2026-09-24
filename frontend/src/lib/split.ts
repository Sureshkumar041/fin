import type { ExpenseSplit, SettlementStatus, SplitInput, SplitMethod } from '@/types';

// Split section of the expense form: its values, how they become the API's
// SplitInput, and a live preview. The backend calculates the real shares;
// the preview only mirrors its rules so what the user sees matches.

export type SplitParticipantFormValues = {
  contactId: string;
  name: string;
  /** CUSTOM only. Kept as typed, like the amount field. */
  shareAmount: string;
  /** PERCENTAGE only. */
  percentage: string;
};

export type SplitFormValues = {
  /** false = a normal personal expense (no split is sent). */
  enabled: boolean;
  method: SplitMethod;
  participants: SplitParticipantFormValues[];
};

export const SPLIT_METHOD_LABELS: Record<SplitMethod, string> = {
  EQUAL: 'Equal',
  CUSTOM: 'Custom',
  PERCENTAGE: 'Percentage',
};

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
};

/** "1 person" / "2 people": the others on a split (you are never counted). */
export const peopleCount = (split: ExpenseSplit) =>
  `${split.participants.length} ${split.participants.length === 1 ? 'person' : 'people'}`;

export const MAX_SPLIT_PARTICIPANTS = 20;

/** The expense's current split drives the form; null starts it as personal. */
export function initialSplitValues(split: ExpenseSplit | null | undefined): SplitFormValues {
  if (!split) return { enabled: false, method: 'EQUAL', participants: [] };
  return {
    enabled: true,
    method: split.method,
    participants: split.participants.map((p) => ({
      contactId: p.contact.id,
      name: p.contact.name,
      shareAmount: split.method === 'CUSTOM' ? String(p.shareAmount) : '',
      percentage: split.method === 'PERCENTAGE' && p.percentage !== null ? String(p.percentage) : '',
    })),
  };
}

/** Builds the request for the selected method, with only that method's field. Call after validateSplit. */
export function toSplitInput(values: SplitFormValues): SplitInput {
  const ids = values.participants.map((p) => p.contactId);
  switch (values.method) {
    case 'EQUAL':
      return { method: 'EQUAL', participants: ids.map((contactId) => ({ contactId })) };
    case 'CUSTOM':
      return {
        method: 'CUSTOM',
        participants: values.participants.map((p) => ({ contactId: p.contactId, shareAmount: Number(p.shareAmount) })),
      };
    case 'PERCENTAGE':
      return {
        method: 'PERCENTAGE',
        participants: values.participants.map((p) => ({ contactId: p.contactId, percentage: Number(p.percentage) })),
      };
  }
}

/** The request that would recreate an existing split (for "did the user change it?"). */
export function splitInputOf(split: ExpenseSplit): SplitInput {
  return toSplitInput(initialSplitValues(split));
}

function participantKey(input: SplitInput): Map<string, number | null> {
  const entries: [string, number | null][] =
    input.method === 'CUSTOM'
      ? input.participants.map((p) => [p.contactId, toPaise(p.shareAmount)])
      : input.method === 'PERCENTAGE'
        ? input.participants.map((p) => [p.contactId, toPaise(p.percentage)])
        : input.participants.map((p) => [p.contactId, null]);
  return new Map(entries);
}

/** Same method, same people and the same shares/percentages (order doesn't matter). */
export function sameSplit(a: SplitInput, b: SplitInput): boolean {
  if (a.method !== b.method) return false;
  const ka = participantKey(a);
  const kb = participantKey(b);
  if (ka.size !== kb.size) return false;
  for (const [id, value] of ka) {
    if (!kb.has(id) || kb.get(id) !== value) return false;
  }
  return true;
}

// ---- Money in integer paise (never add floating-point rupees) ----

const TWO_DECIMALS = /^\d+(\.\d{1,2})?$/;

/** Exact for values with at most 2 decimal places. */
export const toPaise = (value: number) => Math.round(value * 100);
export const fromPaise = (paise: number) => paise / 100;

/** "12.50" -> 1250; null if it isn't a positive-or-zero amount with at most 2 decimals. */
export function parsePaise(text: string): number | null {
  const trimmed = text.trim();
  return TWO_DECIMALS.test(trimmed) ? toPaise(Number(trimmed)) : null;
}

export type SplitPreview = {
  totalPaise: number;
  /** In the same order as the form's participants. */
  sharesPaise: number[];
  othersPaise: number;
  /** Negative when the participants' shares exceed the amount. */
  ownPaise: number;
  /** PERCENTAGE only: 100 minus the participants' percentages. */
  ownPercentage: number | null;
};

/**
 * What the backend will calculate for these values (backend split.service.ts):
 * EQUAL gives everyone the same whole paise and you the leftover; PERCENTAGE
 * rounds each share down and gives the leftover to you, or to the last
 * participant when they cover exactly 100%. Unfilled or invalid rows count as 0.
 * Returns null while the amount isn't a valid number.
 */
export function previewSplit(amount: string, values: SplitFormValues): SplitPreview | null {
  const totalPaise = parsePaise(amount);
  if (totalPaise === null) return null;
  const n = values.participants.length;
  let sharesPaise: number[];
  let ownPercentage: number | null = null;

  if (values.method === 'EQUAL') {
    sharesPaise = Array(n).fill(n > 0 ? Math.floor(totalPaise / (n + 1)) : 0);
  } else if (values.method === 'CUSTOM') {
    sharesPaise = values.participants.map((p) => parsePaise(p.shareAmount) ?? 0);
  } else {
    const basisPoints = values.participants.map((p) => parsePaise(p.percentage) ?? 0); // 100% = 10000
    const totalBasisPoints = basisPoints.reduce((a, b) => a + b, 0);
    // amount x basis points can pass Number.MAX_SAFE_INTEGER, so multiply as BigInt.
    sharesPaise = basisPoints.map((bp) => Number((BigInt(totalPaise) * BigInt(bp)) / BigInt(10000)));
    if (n > 0 && totalBasisPoints === 10000) {
      sharesPaise[n - 1] += totalPaise - sharesPaise.reduce((a, b) => a + b, 0);
    }
    ownPercentage = (10000 - totalBasisPoints) / 100;
  }

  const othersPaise = sharesPaise.reduce((a, b) => a + b, 0);
  return { totalPaise, sharesPaise, othersPaise, ownPaise: totalPaise - othersPaise, ownPercentage };
}
