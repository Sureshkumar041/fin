import { z } from 'zod';

const name = z
  .string('Name is required')
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters');

export const createContactSchema = z.object({ name });

// Only the name can change; same rules as create.
export const updateContactSchema = z.object({ name });

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
