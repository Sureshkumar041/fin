import type { EntityManager } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { ExpenseParticipant, type SettlementStatus } from '../entities/expense-participant.entity';
import type { SplitParticipant } from '../services/split.service';

// Pass a transaction's manager to run inside that transaction.
const repo = (manager: EntityManager = AppDataSource.manager) => manager.getRepository(ExpenseParticipant);

// Participants are only reached through their expense, which is always
// loaded scoped by userId, so these queries need no userId of their own.
export const expenseParticipantRepository = {
  // Participants (with their contacts) of several expenses in a single query,
  // sorted by contact name. Scoped to the user through both the expense and
  // the contact, not only through the expense ids passed in.
  findForExpenses(expenseIds: string[], userId: string): Promise<ExpenseParticipant[]> {
    if (expenseIds.length === 0) return Promise.resolve([]);
    return repo()
      .createQueryBuilder('participant')
      .innerJoin('participant.expense', 'expense', 'expense.userId = :userId', { userId })
      .innerJoinAndSelect('participant.contact', 'contact', 'contact.userId = :userId')
      .where('participant.expenseId IN (:...expenseIds)', { expenseIds })
      .orderBy('contact.name', 'ASC')
      .getMany();
  },

  // Writes new share amounts onto existing rows (id, contact, status and
  // settledAt are kept). One UPDATE per participant, at most 20.
  async updateShares(
    expenseId: string,
    participants: { id: string; shareAmount: number }[],
    manager?: EntityManager,
  ) {
    for (const p of participants) {
      await repo(manager).update({ id: p.id, expenseId }, { shareAmount: p.shareAmount });
    }
  },

  // Settles or un-settles one participant of one expense, but only if it still
  // has the status the caller read (UPDATE ... WHERE status = expected).
  // Returns false when no row matched: its status changed, or it was removed,
  // since the caller looked. Nothing is overwritten in that case.
  async updateSettlement(
    id: string,
    expenseId: string,
    expectedStatus: SettlementStatus,
    changes: { status: SettlementStatus; settledAt: Date | null },
    manager?: EntityManager,
  ): Promise<boolean> {
    const result = await repo(manager).update({ id, expenseId, status: expectedStatus }, changes);
    return (result.affected ?? 0) === 1;
  },

  // Inside a transaction: locks the expense's PENDING participants until it
  // ends (a settlement waits for it) and returns how many there are, so the
  // caller can tell if one was settled since it checked.
  async lockPendingForExpense(expenseId: string, manager: EntityManager): Promise<number> {
    const rows = await repo(manager)
      .createQueryBuilder('participant')
      .select('participant.id')
      .where('participant.expenseId = :expenseId AND participant.status = :status', { expenseId, status: 'PENDING' })
      .setLock('pessimistic_write')
      .getMany();
    return rows.length;
  },

  // Deletes only PENDING participants, so a PAID one can never be removed,
  // even if it was settled after the caller checked. Returns how many went.
  async deletePendingForExpense(expenseId: string, manager?: EntityManager): Promise<number> {
    const result = await repo(manager).delete({ expenseId, status: 'PENDING' });
    return result.affected ?? 0;
  },

  // One INSERT for all rows.
  createMany(expenseId: string, participants: SplitParticipant[], manager?: EntityManager) {
    const rows = participants.map((p) => repo(manager).create({ ...p, expenseId }));
    return repo(manager).save(rows);
  },
};
