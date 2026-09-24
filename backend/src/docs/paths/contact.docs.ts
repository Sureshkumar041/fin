import type { ApiDocsModule } from '../types';
import { errorResponse, ref } from '../types';

const exampleContact = {
  id: '1d4e8f2a-6b3c-4a9d-8e7f-5c2b1a0d9e8f',
  name: 'Rahul',
  owesYou: 500,
  createdAt: '2026-09-23T10:03:36.757Z',
  updatedAt: '2026-09-23T10:03:36.757Z',
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
