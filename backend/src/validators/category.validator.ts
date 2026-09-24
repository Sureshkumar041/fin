import { z } from 'zod';

const name = z
  .string('Name is required')
  .trim()
  .min(1, 'Name is required')
  .max(50, 'Name must be at most 50 characters');

export const createCategorySchema = z.object({ name });

// Only the name can change today; same rules as create.
export const updateCategorySchema = z.object({ name });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
