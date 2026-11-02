import type { IsoDate, IsoDateTime } from './api';
import type { SettlementStatus, SplitMethod } from './split';

/** Someone you split expenses with. Not an app user. */
export type Contact = {
  id: string;
  name: string;
  /** Sum of this contact's PENDING shares on your split expenses. */
  owesYou: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type ContactInput = {
  name: string;
};

/** One split expense a contact is on, with their share of it (GET /contacts/:id/expenses). */
export type ContactExpense = {
  /** Participant id: use it to settle this share. */
  participantId: string;
  expense: {
    id: string;
    description: string | null;
    expenseDate: IsoDate;
    /** Full amount you paid. */
    amount: number;
    splitMethod: SplitMethod;
    category: { id: string; name: string };
  };
  /** This contact's share, calculated by the backend. Never your own share. */
  shareAmount: number;
  /** Set for PERCENTAGE splits only. */
  percentage: number | null;
  status: SettlementStatus;
  /** When the share was marked PAID; null while PENDING. */
  settledAt: IsoDateTime | null;
};

/** A contact's split expenses and totals. All totals are calculated by the backend. */
export type ContactExpenses = {
  contact: Contact;
  summary: {
    /** Sum of PENDING shares; equals contact.owesYou. */
    pendingTotal: number;
    /** Sum of PAID shares. */
    settledTotal: number;
    /** pendingTotal + settledTotal. */
    shareTotal: number;
    /** Sum of the full amounts of these expenses (everyone's shares). */
    expensesTotal: number;
    pendingCount: number;
    settledCount: number;
  };
  /** Newest expense first. */
  expenses: ContactExpense[];
};
