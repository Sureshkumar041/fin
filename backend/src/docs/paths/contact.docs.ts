import type { ApiDocsModule } from '../types';
import { errorResponse, ref } from '../types';

const exampleContact = {
  id: '1d4e8f2a-6b3c-4a9d-8e7f-5c2b1a0d9e8f',
  name: 'Rahul',
  owesYou: 500,
  createdAt: '2026-09-23T10:03:36.757Z',
  updatedAt: '2026-09-23T10:03:36.757Z',
};

const exampleContactExpenses = {
  contact: exampleContact,
  summary: {
    pendingTotal: 500,
    settledTotal: 300,
    shareTotal: 800,
    expensesTotal: 2400,
    pendingCount: 1,
    settledCount: 1,
  },
  expenses: [
    {
      participantId: '5b2c9e1a-7d4f-4c3b-8a6e-1f0d9c8b7a6e',
      expense: {
        id: '9c8b7a6e-5d4c-4b3a-9f2e-1d0c9b8a7f6e',
        description: 'Dinner at Toit',
        expenseDate: '2026-09-22',
        amount: 1500,
        splitMethod: 'EQUAL',
        category: { id: '3f2e1d0c-9b8a-4f7e-8d6c-5b4a3f2e1d0c', name: 'Food' },
      },
      shareAmount: 500,
      percentage: null,
      status: 'PENDING',
      settledAt: null,
    },
    {
      participantId: '6c3d0f2b-8e5a-4d4c-9b7f-2a1e0d9c8b7f',
      expense: {
        id: '0d9c8b7f-6e5d-4c4b-8a3f-2e1d0c9b8a7f',
        description: 'Cab to airport',
        expenseDate: '2026-09-10',
        amount: 900,
        splitMethod: 'PERCENTAGE',
        category: { id: '4a3f2e1d-0c9b-4a8f-9e7d-6c5b4a3f2e1d', name: 'Travel' },
      },
      shareAmount: 300,
      percentage: 33.33,
      status: 'PAID',
      settledAt: '2026-09-12T08:15:00.000Z',
    },
  ],
};

const contactResponse = (description: string, example = exampleContact) => ({
  description,
  content: {
    'application/json': { schema: ref.schema('ContactResponse'), example: { contact: example } },
  },
});

const invalidId = errorResponse('`id` is not a valid UUID', {
  code: 'BAD_REQUEST',
  message: 'Invalid URL parameters',
  details: { id: ['Invalid id'] },
});

const notFound = errorResponse("Contact doesn't exist or belongs to another user", {
  code: 'NOT_FOUND',
  message: 'Contact not found',
});

const duplicateName = errorResponse('Another contact of this user has the same name (case-insensitive)', {
  code: 'CONFLICT',
  message: 'A contact with this name already exists',
});

const body = {
  required: true,
  content: { 'application/json': { schema: ref.schema('ContactInput') } },
};

export const contactDocs: ApiDocsModule = {
  tag: {
    name: 'Contacts',
    description:
      'People the logged-in user splits expenses with. Contacts are not app users and cannot log in. Names are unique per user, ignoring case.',
  },

  schemas: {
    // services/contact.service.ts ContactResponse
    Contact: {
      type: 'object',
      required: ['id', 'name', 'owesYou', 'createdAt', 'updatedAt'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', maxLength: 100 },
        owesYou: {
          type: 'number',
          minimum: 0,
          description: "Total of this contact's PENDING shares on your split expenses. PAID shares are not counted.",
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
      example: exampleContact,
    },
    ContactResponse: {
      type: 'object',
      required: ['contact'],
      properties: { contact: ref.schema('Contact') },
    },
    ContactListResponse: {
      type: 'object',
      required: ['contacts'],
      properties: { contacts: { type: 'array', items: ref.schema('Contact') } },
    },
    // services/contact.service.ts ContactExpensesResponse
    ContactExpensesResponse: {
      type: 'object',
      required: ['contact', 'summary', 'expenses'],
      properties: {
        contact: ref.schema('Contact'),
        summary: {
          type: 'object',
          required: ['pendingTotal', 'settledTotal', 'shareTotal', 'expensesTotal', 'pendingCount', 'settledCount'],
          properties: {
            pendingTotal: { type: 'number', description: "Sum of the contact's PENDING shares. Always equals `contact.owesYou`." },
            settledTotal: { type: 'number', description: "Sum of the contact's PAID shares" },
            shareTotal: { type: 'number', description: 'pendingTotal + settledTotal' },
            expensesTotal: { type: 'number', description: 'Sum of the full amounts of these expenses (everyone\'s shares)' },
            pendingCount: { type: 'integer' },
            settledCount: { type: 'integer' },
          },
        },
        expenses: {
          type: 'array',
          description: 'Newest expense first (by expenseDate, then creation time)',
          items: {
            type: 'object',
            required: ['participantId', 'expense', 'shareAmount', 'percentage', 'status', 'settledAt'],
            properties: {
              participantId: {
                type: 'string',
                format: 'uuid',
                description: 'Use with PATCH /expenses/{id}/split/participants/{participantId} to settle this share',
              },
              expense: {
                type: 'object',
                required: ['id', 'description', 'expenseDate', 'amount', 'splitMethod', 'category'],
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  description: { type: ['string', 'null'] },
                  expenseDate: { type: 'string', format: 'date' },
                  amount: { type: 'number', description: 'Full amount you paid' },
                  splitMethod: { type: 'string', enum: ['EQUAL', 'CUSTOM', 'PERCENTAGE'] },
                  category: {
                    type: 'object',
                    required: ['id', 'name'],
                    properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' } },
                  },
                },
              },
              shareAmount: { type: 'number', description: "This contact's share, as calculated when the split was saved" },
              percentage: { type: ['number', 'null'], description: 'Set for PERCENTAGE splits only' },
              status: { type: 'string', enum: ['PENDING', 'PAID'] },
              settledAt: { type: ['string', 'null'], format: 'date-time', description: 'Set when PAID' },
            },
          },
        },
      },
      example: exampleContactExpenses,
    },
    // validators/contact.validator.ts: create and update use the same rules.
    ContactInput: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
          description: 'Trimmed before validation and stored trimmed',
        },
      },
      example: { name: 'Rahul' },
    },
  },

  paths: {
    '/contacts': {
      get: {
        tags: ['Contacts'],
        summary: 'List contacts',
        description: 'All contacts of the logged-in user, sorted by name, each with the amount they still owe you.',
        operationId: 'listContacts',
        responses: {
          200: {
            description: 'The contacts',
            content: {
              'application/json': {
                schema: ref.schema('ContactListResponse'),
                example: {
                  contacts: [
                    { ...exampleContact, id: '8a7b6c5d-4e3f-4a2b-9c1d-0e9f8a7b6c5d', name: 'Priya', owesYou: 0 },
                    exampleContact,
                  ],
                },
              },
            },
          },
          401: ref.response('Unauthorized'),
          500: ref.response('InternalError'),
        },
      },
      post: {
        tags: ['Contacts'],
        summary: 'Create a contact',
        operationId: 'createContact',
        requestBody: body,
        responses: {
          201: contactResponse('Contact created. `owesYou` is always 0 for a new contact.', {
            ...exampleContact,
            owesYou: 0,
          }),
          400: errorResponse('Validation failed or body is not valid JSON', {
            code: 'BAD_REQUEST',
            message: 'Validation failed',
            details: { name: ['Name is required'] },
          }),
          401: ref.response('Unauthorized'),
          409: duplicateName,
          500: ref.response('InternalError'),
        },
      },
    },

    '/contacts/{id}/expenses': {
      parameters: [ref.parameter('IdParam')],
      get: {
        tags: ['Contacts'],
        summary: "List a contact's split expenses",
        description:
          "Every split expense of yours this contact is on, with their share of each and its settlement status, plus totals. Your own share is never included.",
        operationId: 'listContactExpenses',
        responses: {
          200: {
            description: 'The expenses and totals. `expenses` is empty if the contact is on no split.',
            content: {
              'application/json': {
                schema: ref.schema('ContactExpensesResponse'),
                example: exampleContactExpenses,
              },
            },
          },
          400: invalidId,
          401: ref.response('Unauthorized'),
          404: notFound,
          500: ref.response('InternalError'),
        },
      },
    },

    '/contacts/{id}': {
      parameters: [ref.parameter('IdParam')],
      patch: {
        tags: ['Contacts'],
        summary: 'Rename a contact',
        description: 'Renaming to a different casing of its own name is allowed.',
        operationId: 'updateContact',
        requestBody: body,
        responses: {
          200: contactResponse('Contact updated', { ...exampleContact, name: 'Rahul Kumar' }),
          400: errorResponse('Invalid `id`, validation failed, or body is not valid JSON', {
            code: 'BAD_REQUEST',
            message: 'Validation failed',
            details: { name: ['Name must be at most 100 characters'] },
          }),
          401: ref.response('Unauthorized'),
          404: notFound,
          409: duplicateName,
          500: ref.response('InternalError'),
        },
      },
      delete: {
        tags: ['Contacts'],
        summary: 'Delete a contact',
        description: 'Only a contact who is not on any split expense (pending or paid) can be deleted.',
        operationId: 'deleteContact',
        responses: {
          204: { description: 'Contact deleted' },
          400: invalidId,
          401: ref.response('Unauthorized'),
          404: notFound,
          409: errorResponse('The contact is a participant on one or more split expenses', {
            code: 'CONFLICT',
            message: 'Contact is part of split expenses; remove them from those splits first',
          }),
          500: ref.response('InternalError'),
        },
      },
    },
  },
};
