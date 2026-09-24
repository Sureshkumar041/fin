import type { Category, CategoryInput } from '@/types';
import { apiRequest } from './client';

export const categoriesApi = {
  list: () => apiRequest<{ categories: Category[] }>('/categories').then((r) => r.categories),

  get: (id: string) =>
    apiRequest<{ category: Category }>(`/categories/${id}`).then((r) => r.category),

  create: (input: CategoryInput) =>
    apiRequest<{ category: Category }>('/categories', { method: 'POST', body: input }).then(
      (r) => r.category,
    ),

  update: (id: string, input: CategoryInput) =>
    apiRequest<{ category: Category }>(`/categories/${id}`, { method: 'PATCH', body: input }).then(
      (r) => r.category,
    ),

  remove: (id: string) => apiRequest<void>(`/categories/${id}`, { method: 'DELETE' }),
};
