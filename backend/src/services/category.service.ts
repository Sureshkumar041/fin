import type { Category } from '../entities/category.entity';
import { categoryRepository } from '../repositories/category.repository';
import { isForeignKeyViolation, isUniqueViolation } from '../utils/db-errors';
import { HttpError } from '../utils/http-error';
import type { CreateCategoryInput, UpdateCategoryInput } from '../validators/category.validator';

export type CategoryResponse = Pick<Category, 'id' | 'name' | 'createdAt' | 'updatedAt'>;

function toCategoryResponse(category: Category): CategoryResponse {
  return {
    id: category.id,
    name: category.name,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

const duplicateNameError = () => new HttpError(409, 'A category with this name already exists');

// Throws 404 whether the category doesn't exist or belongs to someone else,
// so the API never reveals which ids exist for other users.
async function findOwnedOrFail(id: string, userId: string): Promise<Category> {
  const category = await categoryRepository.findByIdForUser(id, userId);
  if (!category) {
    throw new HttpError(404, 'Category not found');
  }
  return category;
}

async function ensureNameIsFree(name: string, userId: string, exceptId?: string) {
  const existing = await categoryRepository.findByNameForUser(name, userId);
  if (existing && existing.id !== exceptId) {
    throw duplicateNameError();
  }
}

export const categoryService = {
  async list(userId: string): Promise<CategoryResponse[]> {
    const categories = await categoryRepository.findAllByUser(userId);
    return categories.map(toCategoryResponse);
  },

  async getById(id: string, userId: string): Promise<CategoryResponse> {
    return toCategoryResponse(await findOwnedOrFail(id, userId));
  },

  async create(input: CreateCategoryInput, userId: string): Promise<CategoryResponse> {
    await ensureNameIsFree(input.name, userId);
    try {
      const category = await categoryRepository.create({ userId, name: input.name });
      return toCategoryResponse(category);
    } catch (err) {
      // The unique constraint catches two identical creates racing each other.
      if (isUniqueViolation(err)) throw duplicateNameError();
      throw err;
    }
  },

  async update(id: string, input: UpdateCategoryInput, userId: string): Promise<CategoryResponse> {
    const category = await findOwnedOrFail(id, userId);
    // exceptId lets a category be renamed to a different casing of its own name.
    await ensureNameIsFree(input.name, userId, category.id);

    category.name = input.name;
    try {
      return toCategoryResponse(await categoryRepository.save(category));
    } catch (err) {
      if (isUniqueViolation(err)) throw duplicateNameError();
      throw err;
    }
  },

  async remove(id: string, userId: string): Promise<void> {
    const category = await findOwnedOrFail(id, userId);
    try {
      await categoryRepository.remove(category);
    } catch (err) {
      // expenses.category_id is ON DELETE RESTRICT.
      if (isForeignKeyViolation(err)) {
        throw new HttpError(409, 'Category has expenses; move or delete them first');
      }
      throw err;
    }
  },
};
