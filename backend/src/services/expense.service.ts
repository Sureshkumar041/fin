import type { EntityManager } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import type { Expense } from '../entities/expense.entity';
import type { SettlementStatus } from '../entities/expense-participant.entity';
import { categoryRepository } from '../repositories/category.repository';
import { expenseParticipantRepository } from '../repositories/expense-participant.repository';
import { expenseRepository } from '../repositories/expense.repository';
import { HttpError } from '../utils/http-error';
import { toPaise } from '../utils/money';
import type {
  CreateExpenseInput,
  ListExpensesQuery,
  UpdateExpenseInput,
} from '../validators/expense.validator';
import type { SplitInput } from '../validators/split.validator';
import { splitService, type SplitSummary } from './split.service';

export type ExpenseResponse = {
  id: string;
  amount: number;
  description: string | null;
  expenseDate: string;
  category: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
};

export type ExpenseSplitResponse = Omit<SplitSummary, 'participants'> & {
  participants: {
    id: string;
    contact: { id: string; name: string };
    shareAmount: number;
    percentage: number | null;
    status: SettlementStatus;
    settledAt: Date | null;
  }[];
};

// Returned by POST and the GET endpoints; split is null for a personal expense.
export type ExpenseWithSplitResponse = ExpenseResponse & { split: ExpenseSplitResponse | null };

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

// Expects the category relation to be loaded.
function toExpenseResponse(expense: Expense): ExpenseResponse {
  return {
    id: expense.id,
    amount: expense.amount,
    description: expense.description,
    expenseDate: expense.expenseDate,
    category: { id: expense.category.id, name: expense.category.name },
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

// Expects the category and participants.contact relations to be loaded.
// ownShare, owedToYou and settledToYou are derived here, never stored.
function toExpenseWithSplitResponse(expense: Expense): ExpenseWithSplitResponse {
  if (!expense.splitMethod) {
    return { ...toExpenseResponse(expense), split: null };
  }
  const { participants, ...totals } = splitService.summarize(
    expense.amount,
    expense.splitMethod,
    expense.participants,
  );
  return {
    ...toExpenseResponse(expense),
    split: {
      ...totals,
      participants: participants.map((p) => ({
        id: p.id,
        contact: { id: p.contact.id, name: p.contact.name },
        shareAmount: p.shareAmount,
        percentage: p.percentage,
        status: p.status,
        settledAt: p.settledAt,
      })),
    },
  };
}

// Loads the participants (with contacts) of all split expenses among these in
// one query and attaches them; personal expenses get an empty list. Used for
// a single expense and for a whole page alike, so there is no per-expense query.
async function attachParticipants(expenses: Expense[], userId: string): Promise<Expense[]> {
  const splitIds = expenses.filter((e) => e.splitMethod).map((e) => e.id);
  const participants = await expenseParticipantRepository.findForExpenses(splitIds, userId);
  for (const expense of expenses) {
    expense.participants = participants.filter((p) => p.expenseId === expense.id);
  }
  return expenses;
}

// splitService reports its 400s under "participants"/"amount". Report them
// under the request field that caused them instead: "split" on create (where
// the split's schema errors also appear), "amount" on an amount change.
async function reportSplitErrorsUnder<T>(field: string, run: () => T | Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof HttpError && err.status === 400 && err.details) {
      const messages = Object.values(err.details as Record<string, string[]>).flat();
      throw new HttpError(400, err.message, { [field]: messages });
    }
    throw err;
  }
}

const buildSplit = (amount: number, split: SplitInput, userId: string) =>
  reportSplitErrorsUnder('split', () => splitService.build(amount, split, userId));

// Inside a transaction: removes the participants that were checked as all
// PENDING before it. Only PENDING rows are deleted, so if the count differs,
// someone was settled (or the split replaced) since the check: throwing rolls
// the whole transaction back instead of touching a PAID participant.
async function deleteCheckedParticipants(expenseId: string, expectedCount: number, manager: EntityManager) {
  const removed = await expenseParticipantRepository.deletePendingForExpense(expenseId, manager);
  if (removed !== expectedCount) throw splitChangedError();
}

// Another request settled, un-settled or replaced participants between this
// request's check and its write; throwing rolls the write back.
const splitChangedError = () =>
  new HttpError(409, 'The split changed while it was being updated; please try again');

// 404 both for "doesn't exist" and "belongs to someone else", so ids of
// other users' expenses can't be discovered.
async function findOwnedOrFail(id: string, userId: string): Promise<Expense> {
  const expense = await expenseRepository.findByIdForUser(id, userId);
  if (!expense) {
    throw new HttpError(404, 'Expense not found');
  }
  return expense;
}

// The categoryId comes from the request body, so it must be checked:
// otherwise a user could file an expense under someone else's category.
async function ensureCategoryIsOwned(categoryId: string, userId: string) {
  const category = await categoryRepository.findByIdForUser(categoryId, userId);
  if (!category) {
    throw new HttpError(400, 'Validation failed', { categoryId: ['Category not found'] });
  }
}

export const expenseService = {
  async list(
    userId: string,
    query: ListExpensesQuery,
  ): Promise<{ expenses: ExpenseWithSplitResponse[]; pagination: Pagination }> {
    const { page, limit, ...filters } = query;
    const { items, total } = await expenseRepository.findPageForUser(userId, filters, {
      skip: (page - 1) * limit,
      take: limit,
    });

    // The page query is unchanged; participants come from one extra query.
    await attachParticipants(items, userId);

    return {
      expenses: items.map(toExpenseWithSplitResponse),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string, userId: string): Promise<ExpenseWithSplitResponse> {
    const [expense] = await attachParticipants([await findOwnedOrFail(id, userId)], userId);
    return toExpenseWithSplitResponse(expense);
  },

  async create(input: CreateExpenseInput, userId: string): Promise<ExpenseWithSplitResponse> {
    const { split, ...fields } = input;
    await ensureCategoryIsOwned(fields.categoryId, userId);

    let expenseId: string;
    if (!split) {
      expenseId = (await expenseRepository.create({ ...fields, userId })).id;
    } else {
      // All checks and calculation happen before anything is written.
      const summary = await buildSplit(fields.amount, split, userId);

      // The expense and its participants are saved together or not at all.
      expenseId = await AppDataSource.transaction(async (manager) => {
        const expense = await expenseRepository.create(
          { ...fields, userId, splitMethod: split.method },
          manager,
        );
        await expenseParticipantRepository.createMany(expense.id, summary.participants, manager);
        return expense.id;
      });
    }

    // Reload to include the category (and participants) in the response.
    return this.getById(expenseId, userId);
  },

  async update(id: string, input: UpdateExpenseInput, userId: string): Promise<ExpenseWithSplitResponse> {
    const expense = await findOwnedOrFail(id, userId);
    if (input.categoryId) {
      await ensureCategoryIsOwned(input.categoryId, userId);
    }

    // Re-sending the current amount is not a change, so it never hits the
    // settlement lock. Compared in paise to avoid floating-point noise.
    const amountChanges =
      input.amount !== undefined && toPaise(input.amount) !== toPaise(expense.amount);

    if (!expense.splitMethod || !amountChanges) {
      // Personal expense, or only description/category/date: as before.
      // These stay editable even after participants have paid.
      await expenseRepository.update(id, userId, input);
    } else {
      const newAmount = input.amount!;
      await attachParticipants([expense], userId);
      // Throws 409 if anyone has paid, or 400 if the new amount can't carry
      // the split, before anything is written.
      const recalculated = await reportSplitErrorsUnder('amount', () =>
        splitService.recalculateForAmount(newAmount, expense.splitMethod!, expense.participants),
      );

      // The amount and the shares change together or not at all.
      await AppDataSource.transaction(async (manager) => {
        // Lock the participants, still all PENDING, so none can be settled
        // until this commits; 409 if one was settled since the check above.
        const pending = await expenseParticipantRepository.lockPendingForExpense(id, manager);
        if (pending !== expense.participants.length) throw splitChangedError();
        await expenseRepository.update(id, userId, input, manager);
        // CUSTOM keeps its shares; the owner's derived share absorbs the change.
        if (expense.splitMethod !== 'CUSTOM') {
          await expenseParticipantRepository.updateShares(id, recalculated.participants, manager);
        }
      });
    }

    return this.getById(id, userId);
  },

  // PUT /expenses/:id/split: turns a personal expense into a split, or
  // replaces an existing split. The expense amount never changes here.
  async replaceSplit(id: string, input: SplitInput, userId: string): Promise<ExpenseWithSplitResponse> {
    const expense = await findOwnedOrFail(id, userId);
    await attachParticipants([expense], userId);

    // Everything is checked before anything is written: 409 if anyone has
    // paid, 400 for bad contacts or shares.
    splitService.assertNotSettled(expense.participants);
    const summary = await splitService.build(expense.amount, input, userId);

    // Method, old rows and new rows change together or not at all. New rows
    // get new ids; old ids are not reused.
    await AppDataSource.transaction(async (manager) => {
      await expenseRepository.update(id, userId, { splitMethod: input.method }, manager);
      await deleteCheckedParticipants(id, expense.participants.length, manager);
      await expenseParticipantRepository.createMany(id, summary.participants, manager);
    });

    return this.getById(id, userId);
  },

  // DELETE /expenses/:id/split: turns a split expense back into a personal
  // one. Only the split goes; the expense and its fields stay as they are.
  async removeSplit(id: string, userId: string): Promise<ExpenseWithSplitResponse> {
    const expense = await findOwnedOrFail(id, userId);
    if (!expense.splitMethod) {
      throw new HttpError(409, 'Expense does not have a split');
    }
    await attachParticipants([expense], userId);
    // 409 before anything is written if anyone has paid.
    splitService.assertNotSettled(expense.participants);

    // Method and participants go together or not at all.
    await AppDataSource.transaction(async (manager) => {
      await expenseRepository.update(id, userId, { splitMethod: null }, manager);
      await deleteCheckedParticipants(id, expense.participants.length, manager);
    });

    return this.getById(id, userId);
  },

  // PATCH /expenses/:id/split/participants/:participantId: marks one
  // participant PAID or PENDING. Only that participant's status and settledAt
  // change; the expense, shares and split stay as they are, and a PAID
  // participant can always be set back to PENDING.
  async settleParticipant(
    id: string,
    participantId: string,
    status: SettlementStatus,
    userId: string,
  ): Promise<ExpenseWithSplitResponse> {
    const expense = await findOwnedOrFail(id, userId);
    if (!expense.splitMethod) {
      throw new HttpError(409, 'Expense does not have a split');
    }
    // Only this user's expense's participants are loaded, so a participant of
    // another expense (or another user) is simply not found: 404.
    await attachParticipants([expense], userId);
    const current = expense.participants.find((p) => p.id === participantId);
    const settled = splitService.settle(expense.participants, participantId, status);

    // Same status: nothing to write, settledAt is kept.
    if (settled.status !== current!.status) {
      await AppDataSource.transaction(async (manager) => {
        const updated = await expenseParticipantRepository.updateSettlement(
          participantId,
          id,
          current!.status,
          { status: settled.status, settledAt: settled.settledAt },
          manager,
        );
        if (!updated) throw splitChangedError();
      });
    }

    return this.getById(id, userId);
  },

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await expenseRepository.deleteForUser(id, userId);
    if (!deleted) {
      throw new HttpError(404, 'Expense not found');
    }
  },
};
