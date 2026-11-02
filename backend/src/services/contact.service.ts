import type { Contact } from '../entities/contact.entity';
import type { SplitMethod } from '../entities/expense.entity';
import type { SettlementStatus } from '../entities/expense-participant.entity';
import { contactRepository } from '../repositories/contact.repository';
import { expenseParticipantRepository } from '../repositories/expense-participant.repository';
import { isForeignKeyViolation, isUniqueViolation } from '../utils/db-errors';
import { decimalToNumber } from '../utils/decimal-transformer';
import { HttpError } from '../utils/http-error';
import { fromPaise, toPaise } from '../utils/money';
import type { CreateContactInput, UpdateContactInput } from '../validators/contact.validator';

type ContactFields = Pick<Contact, 'id' | 'name' | 'createdAt' | 'updatedAt'>;

export type ContactResponse = ContactFields & {
  // Sum of this contact's PENDING shares on the user's split expenses.
  owesYou: number;
};

function toContactResponse(contact: ContactFields, owesYou: string | number): ContactResponse {
  return {
    id: contact.id,
    name: contact.name,
    owesYou: decimalToNumber.from(String(owesYou)) ?? 0,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

// One split expense this contact is on, with their share of it. The user's
// own share is never included: the payer has no participant row.
export type ContactExpenseResponse = {
  // Participant id: settle it via PATCH /expenses/:id/split/participants/:participantId.
  participantId: string;
  expense: {
    id: string;
    description: string | null;
    expenseDate: string;
    amount: number;
    splitMethod: SplitMethod;
    category: { id: string; name: string };
  };
  shareAmount: number;
  percentage: number | null;
  status: SettlementStatus;
  settledAt: Date | null;
};

export type ContactExpensesResponse = {
  contact: ContactResponse;
  summary: {
    // Sum of this contact's PENDING shares; always equals contact.owesYou.
    pendingTotal: number;
    // Sum of this contact's PAID shares.
    settledTotal: number;
    // pendingTotal + settledTotal.
    shareTotal: number;
    // Sum of the full amounts of these expenses (everyone's shares).
    expensesTotal: number;
    pendingCount: number;
    settledCount: number;
  };
  // Newest expense first.
  expenses: ContactExpenseResponse[];
};

const duplicateNameError =() => new HttpError(409, 'A contact with this name already exists');

// Throws 404 whether the contact doesn't exist or belongs to someone else,
// so the API never reveals which ids exist for other users.
async function findOwnedOrFail(id: string, userId: string): Promise<Contact> {
  const contact = await contactRepository.findByIdForUser(id, userId);
  if (!contact) {
    throw new HttpError(404, 'Contact not found');
  }
  return contact;
}

async function ensureNameIsFree(name: string, userId: string, exceptId?: string) {
  const existing = await contactRepository.findByNameForUser(name, userId);
  if (existing && existing.id !== exceptId) {
    throw duplicateNameError();
  }
}

export const contactService = {
  async list(userId: string): Promise<ContactResponse[]> {
    const rows = await contactRepository.findAllByUserWithOwesYou(userId);
    return rows.map((row) => toContactResponse(row, row.owesYou));
  },

  // Totals are summed in integer paise, so they match the SQL SUM behind owesYou exactly.
  async listExpenses(id: string, userId: string): Promise<ContactExpensesResponse> {
    const contact = await findOwnedOrFail(id, userId);
    const participants = await expenseParticipantRepository.findForContact(contact.id, userId);

    let pending = 0;
    let settled = 0;
    let expensesTotal = 0;
    let pendingCount = 0;
    for (const p of participants) {
      if (p.status === 'PENDING') {
        pending += toPaise(p.shareAmount);
        pendingCount += 1;
      } else {
        settled += toPaise(p.shareAmount);
      }
      expensesTotal += toPaise(p.expense.amount);
    }

    return {
      contact: toContactResponse(contact, fromPaise(pending)),
      summary: {
        pendingTotal: fromPaise(pending),
        settledTotal: fromPaise(settled),
        shareTotal: fromPaise(pending + settled),
        expensesTotal: fromPaise(expensesTotal),
        pendingCount,
        settledCount: participants.length - pendingCount,
      },
      expenses: participants.map((p) => ({
        participantId: p.id,
        expense: {
          id: p.expense.id,
          description: p.expense.description,
          expenseDate: p.expense.expenseDate,
          amount: p.expense.amount,
          // Only split expenses have participants, so the method is always set.
          splitMethod: p.expense.splitMethod as SplitMethod,
          category: { id: p.expense.category.id, name: p.expense.category.name },
        },
        shareAmount: p.shareAmount,
        percentage: p.percentage,
        status: p.status,
        settledAt: p.settledAt,
      })),
    };
  },

  async create(input: CreateContactInput, userId: string): Promise<ContactResponse> {
    await ensureNameIsFree(input.name, userId);
    try {
      const contact = await contactRepository.create({ userId, name: input.name });
      // A brand-new contact can't be on any split yet.
      return toContactResponse(contact, 0);
    } catch (err) {
      // uq_contacts_user_name (case-insensitive) catches two creates racing each other.
      if (isUniqueViolation(err)) throw duplicateNameError();
      throw err;
    }
  },

  async update(id: string, input: UpdateContactInput, userId: string): Promise<ContactResponse> {
    const contact = await findOwnedOrFail(id, userId);
    // exceptId lets a contact be renamed to a different casing of its own name.
    await ensureNameIsFree(input.name, userId, contact.id);

    contact.name = input.name;
    let saved: Contact;
    try {
      saved = await contactRepository.save(contact);
    } catch (err) {
      if (isUniqueViolation(err)) throw duplicateNameError();
      throw err;
    }
    return toContactResponse(saved, await contactRepository.getOwesYou(saved.id, userId));
  },

  async remove(id: string, userId: string): Promise<void> {
    const contact = await findOwnedOrFail(id, userId);
    try {
      await contactRepository.remove(contact);
    } catch (err) {
      // expense_participants.contact_id is ON DELETE RESTRICT.
      if (isForeignKeyViolation(err)) {
        throw new HttpError(409, 'Contact is part of split expenses; remove them from those splits first');
      }
      throw err;
    }
  },
};
