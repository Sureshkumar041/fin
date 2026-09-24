import type { EntityManager } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Expense, type SplitMethod } from '../entities/expense.entity';

// Pass a transaction's manager to run inside that transaction.
const repo = (manager: EntityManager = AppDataSource.manager) => manager.getRepository(Expense);

export type ExpenseFilters = {
  categoryId?: string;
  from?: string;
  to?: string;
  search?: string;
};

type ExpenseChanges = Partial<
  Pick<Expense, 'amount' | 'categoryId' | 'expenseDate' | 'description'>
>;

// update() may also set the split method (PUT /expenses/:id/split) or clear
// it back to NULL (DELETE /expenses/:id/split).
type ExpenseUpdate = ExpenseChanges & { splitMethod?: SplitMethod | null };

// Escape LIKE wildcards so a search for "50%" matches the literal text.
const escapeLike = (text: string) => text.replace(/[\\%_]/g, '\\$&');

// Every query includes userId in its WHERE clause, so an expense belonging to
// another user is simply never found, whatever id is in the URL.
export const expenseRepository = {
  findByIdForUser(id: string, userId: string) {
    return repo().findOne({ where: { id, userId }, relations: { category: true } });
  },

  async findPageForUser(
    userId: string,
    filters: ExpenseFilters,
    page: { skip: number; take: number },
  ) {
    const query = repo()
      .createQueryBuilder('expense')
      .innerJoinAndSelect('expense.category', 'category')
      .where('expense.userId = :userId', { userId });

    if (filters.categoryId) {
      query.andWhere('expense.categoryId = :categoryId', { categoryId: filters.categoryId });
    }
    if (filters.from) {
      query.andWhere('expense.expenseDate >= :from', { from: filters.from });
    }
    if (filters.to) {
      query.andWhere('expense.expenseDate <= :to', { to: filters.to });
    }
    if (filters.search) {
      query.andWhere('expense.description ILIKE :search', {
        search: `%${escapeLike(filters.search)}%`,
      });
    }

    // Newest first; created_at and id break ties so pages never overlap.
    const [items, total] = await query
      .orderBy('expense.expenseDate', 'DESC')
      .addOrderBy('expense.createdAt', 'DESC')
      .addOrderBy('expense.id', 'DESC')
      .skip(page.skip)
      .take(page.take)
      .getManyAndCount();

    return { items, total };
  },

  // splitMethod left out = NULL = a personal expense.
  create(
    data: Required<ExpenseChanges> & { userId: string; splitMethod?: SplitMethod },
    manager?: EntityManager,
  ) {
    return repo(manager).save(repo(manager).create(data));
  },

  // UPDATE ... WHERE id = $1 AND user_id = $2
  update(id: string, userId: string, changes: ExpenseUpdate, manager?: EntityManager) {
    return repo(manager).update({ id, userId }, changes);
  },

  // DELETE ... WHERE id = $1 AND user_id = $2
  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result = await repo().delete({ id, userId });
    return (result.affected ?? 0) > 0;
  },
};
