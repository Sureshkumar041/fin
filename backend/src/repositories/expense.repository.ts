import { AppDataSource } from '../config/data-source';
import { Expense } from '../entities/expense.entity';

const repo = () => AppDataSource.getRepository(Expense);

export type ExpenseFilters = {
  categoryId?: string;
  from?: string;
  to?: string;
  search?: string;
};

type ExpenseChanges = Partial<
  Pick<Expense, 'amount' | 'categoryId' | 'expenseDate' | 'description'>
>;

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

  create(data: Required<ExpenseChanges> & { userId: string }) {
    return repo().save(repo().create(data));
  },

  // UPDATE ... WHERE id = $1 AND user_id = $2
  update(id: string, userId: string, changes: ExpenseChanges) {
    return repo().update({ id, userId }, changes);
  },

  // DELETE ... WHERE id = $1 AND user_id = $2
  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const result = await repo().delete({ id, userId });
    return (result.affected ?? 0) > 0;
  },
};
