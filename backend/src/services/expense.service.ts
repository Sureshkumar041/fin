import type { Expense } from '../entities/expense.entity';
import { categoryRepository } from '../repositories/category.repository';
import { expenseRepository } from '../repositories/expense.repository';
import { HttpError } from '../utils/http-error';
import type {
  CreateExpenseInput,
  ListExpensesQuery,
  UpdateExpenseInput,
} from '../validators/expense.validator';

export type ExpenseResponse = {
  id: string;
  amount: number;
  description: string | null;
  expenseDate: string;
  category: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
};

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
  ): Promise<{ expenses: ExpenseResponse[]; pagination: Pagination }> {
    const { page, limit, ...filters } = query;
    const { items, total } = await expenseRepository.findPageForUser(userId, filters, {
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      expenses: items.map(toExpenseResponse),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string, userId: string): Promise<ExpenseResponse> {
    return toExpenseResponse(await findOwnedOrFail(id, userId));
  },

  async create(input: CreateExpenseInput, userId: string): Promise<ExpenseResponse> {
    await ensureCategoryIsOwned(input.categoryId, userId);
    const expense = await expenseRepository.create({ ...input, userId });
    // Reload to include the category in the response.
    return toExpenseResponse(await findOwnedOrFail(expense.id, userId));
  },

  async update(id: string, input: UpdateExpenseInput, userId: string): Promise<ExpenseResponse> {
    await findOwnedOrFail(id, userId);
    if (input.categoryId) {
      await ensureCategoryIsOwned(input.categoryId, userId);
    }

    await expenseRepository.update(id, userId, input);
    return toExpenseResponse(await findOwnedOrFail(id, userId));
  },

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await expenseRepository.deleteForUser(id, userId);
    if (!deleted) {
      throw new HttpError(404, 'Expense not found');
    }
  },
};
