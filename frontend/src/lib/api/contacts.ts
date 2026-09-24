import type { Contact, ContactInput } from '@/types';
import { apiRequest } from './client';

export const contactsApi = {
  /** Sorted by name, each with the amount they still owe you. */
  list: () => apiRequest<{ contacts: Contact[] }>('/contacts').then((r) => r.contacts),

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
