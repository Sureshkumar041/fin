import type { Contact, ContactExpenses, ContactInput } from '@/types';
import { apiRequest } from './client';

export const contactsApi = {
  /** Sorted by name, each with the amount they still owe you. */
  list: () => apiRequest<{ contacts: Contact[] }>('/contacts').then((r) => r.contacts),

  /** The contact's split expenses (newest first) with their share of each, plus totals. */
  expenses: (id: string) => apiRequest<ContactExpenses>(`/contacts/${id}/expenses`),

  create: (input: ContactInput) =>
    apiRequest<{ contact: Contact }>('/contacts', { method: 'POST', body: input }).then(
      (r) => r.contact,
    ),

  update: (id: string, input: ContactInput) =>
    apiRequest<{ contact: Contact }>(`/contacts/${id}`, { method: 'PATCH', body: input }).then(
      (r) => r.contact,
    ),

  /** 409 if the contact is on any split expense. */
  remove: (id: string) => apiRequest<void>(`/contacts/${id}`, { method: 'DELETE' }),
};
