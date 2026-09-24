import type { ApiDocsModule, SchemaObject } from '../types';
import { errorResponse, ref } from '../types';

const exampleExpense = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  amount: 42.5,
  description: 'Weekly shopping',
  expenseDate: '2026-09-20',
  category: { id: '3f1c2a4e-8b7d-4c6a-9e2f-1a2b3c4d5e6f', name: 'Groceries' },
  createdAt: '2026-09-20T18:12:04.101Z',
  updatedAt: '2026-09-20T18:12:04.101Z',
};

const exampleCategoryId = '3f1c2a4e-8b7d-4c6a-9e2f-1a2b3c4d5e6f';
const rahulId = '1d4e8f2a-6b3c-4a9d-8e7f-5c2b1a0d9e8f';
const priyaId = '8a7b6c5d-4e3f-4a2b-9c1d-0e9f8a7b6c5d';

const splitRequestBase = {
  amount: 1200,
  categoryId: exampleCategoryId,
  expenseDate: '2026-09-20',
  description: 'Team dinner',
};

const exampleSplitExpense = {
  ...exampleExpense,
  amount: 1200,
  description: 'Team dinner',
  category: { id: exampleCategoryId, name: 'Food' },
  split: {
    method: 'CUSTOM',
    ownShare: 400,
    ownPercentage: null,
    othersShare: 800,
    owedToYou: 800,
    settledToYou: 0,
    participants: [
      {
        id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
        contact: { id: priyaId, name: 'Priya' },
        shareAmount: 300,
        percentage: null,
        status: 'PENDING',
        settledAt: null,
      },
      {
        id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        contact: { id: rahulId, name: 'Rahul' },
        shareAmount: 500,
        percentage: null,
        status: 'PENDING',
        settledAt: null,
      },
    ],
  },
};

const invalidId = errorResponse('`id` is not a valid UUID', {
  code: 'BAD_REQUEST',
  message: 'Invalid URL parameters',
  details: { id: ['Invalid id'] },
});

const notFound = errorResponse("Expense doesn't exist or belongs to another user", {
  code: 'NOT_FOUND',
  message: 'Expense not found',
});

// validators/expense.validator.ts. Amount matches NUMERIC(12,2).
const amount: SchemaObject = {
  type: 'number',
  exclusiveMinimum: 0,
  maximum: 9999999999.99,
  description: 'Greater than 0, at most 2 decimal places. Must be a JSON number, not a string.',
};

const description: SchemaObject = {
  type: ['string', 'null'],
  maxLength: 255,
  description: 'Trimmed; an empty or whitespace-only string is stored as null.',
};

export const expenseDocs: ApiDocsModule = {
  tag: { name: 'Expenses', description: "The logged-in user's expenses." },

  schemas: {
    // services/expense.service.ts ExpenseResponse
    Expense: {
      type: 'object',
      required: ['id', 'amount', 'description', 'expenseDate', 'category', 'createdAt', 'updatedAt'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        amount: { type: 'number', description: 'Up to 2 decimal places' },
        description: { type: ['string', 'null'], maxLength: 255 },
        expenseDate: { type: 'string', format: 'date', description: 'Calendar date, no time zone' },
        category: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
      example: exampleExpense,
    },
    Pagination: {
      type: 'object',
      required: ['page', 'limit', 'total', 'totalPages'],
      properties: {
        page: { type: 'integer', minimum: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
        total: { type: 'integer', minimum: 0, description: 'Number of expenses matching the filters' },
        totalPages: { type: 'integer', minimum: 0 },
      },
    },
    ExpenseListResponse: {
      type: 'object',
      required: ['expenses', 'pagination'],
      properties: {
        expenses: { type: 'array', items: ref.schema('ExpenseWithSplit') },
        pagination: ref.schema('Pagination'),
      },
    },
    CreateExpenseRequest: {
      type: 'object',
      required: ['amount', 'categoryId', 'expenseDate'],
      properties: {
        amount,
        categoryId: { type: 'string', format: 'uuid', description: 'Must be one of your own categories' },
        expenseDate: { type: 'string', format: 'date', description: 'YYYY-MM-DD, a real calendar date' },
        description: { ...description, default: null },
        split: {
          ...ref.schema('SplitInput'),
          description: 'Leave out for a normal personal expense. When present, the expense is split with these contacts.',
        },
      },
      example: {
        amount: 42.5,
        categoryId: '3f1c2a4e-8b7d-4c6a-9e2f-1a2b3c4d5e6f',
        expenseDate: '2026-09-20',
        description: 'Weekly shopping',
      },
    },
    // validators/split.validator.ts settlementSchema
    SettlementRequest: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['PENDING', 'PAID'],
          description: 'PAID records that the participant has paid you (settledAt = now); PENDING undoes it (settledAt = null)',
        },
      },
      example: { status: 'PAID' },
    },
    // validators/split.validator.ts
    SplitInput: {
      type: 'object',
      required: ['method', 'participants'],
      description:
        'You (the payer) are never listed: your share is always the amount minus the participants\' shares.\n\n' +
        '- **EQUAL**: the amount is divided between the participants and you. Each gets the same whole number of paise; you get any leftover paise.\n' +
        '- **CUSTOM**: each participant has a `shareAmount`; the shares may add up to at most the amount (your share may be 0).\n' +
        '- **PERCENTAGE**: each participant has a `percentage`; they may add up to at most 100 (yours is the rest, and may be 0). ' +
        'Shares are rounded down to the paisa; leftover paise go to you, or to the last participant when the percentages add up to exactly 100.',
      properties: {
        method: { type: 'string', enum: ['EQUAL', 'CUSTOM', 'PERCENTAGE'] },
        participants: {
          type: 'array',
          minItems: 1,
          maxItems: 20,
          description: 'Each contact at most once, and every contact must be one of yours',
          items: ref.schema('SplitParticipantInput'),
        },
      },
    },
    SplitParticipantInput: {
      type: 'object',
      required: ['contactId'],
      properties: {
        contactId: { type: 'string', format: 'uuid' },
        shareAmount: {
          ...amount,
          description: 'CUSTOM only (required there, not allowed otherwise). Greater than 0, at most 2 decimal places.',
        },
        percentage: {
          type: 'number',
          exclusiveMinimum: 0,
          maximum: 100,
          description: 'PERCENTAGE only (required there, not allowed otherwise). At most 2 decimal places.',
        },
      },
    },
    // services/expense.service.ts ExpenseSplitResponse. Nothing here is stored
    // except the participants' shares and statuses; the totals are derived.
    ExpenseSplit: {
      type: 'object',
      required: ['method', 'ownShare', 'ownPercentage', 'othersShare', 'owedToYou', 'settledToYou', 'participants'],
      properties: {
        method: { type: 'string', enum: ['EQUAL', 'CUSTOM', 'PERCENTAGE'] },
        ownShare: { type: 'number', description: 'Your own share: amount minus all participant shares' },
        ownPercentage: {
          type: ['number', 'null'],
          description: 'Your percentage (100 minus the participants\'); null unless the method is PERCENTAGE',
        },
        othersShare: { type: 'number', description: 'Sum of all participant shares' },
        owedToYou: { type: 'number', description: 'Sum of PENDING participant shares' },
        settledToYou: { type: 'number', description: 'Sum of PAID participant shares' },
        participants: {
          type: 'array',
          description: 'Sorted by contact name',
          items: {
            type: 'object',
            required: ['id', 'contact', 'shareAmount', 'percentage', 'status', 'settledAt'],
            properties: {
              id: { type: 'string', format: 'uuid', description: 'Participant id' },
              contact: {
                type: 'object',
                required: ['id', 'name'],
                properties: { id: { type: 'string', format: 'uuid' }, name: { type: 'string' } },
              },
              shareAmount: { type: 'number' },
              percentage: { type: ['number', 'null'], description: 'Set for PERCENTAGE splits only' },
              status: { type: 'string', enum: ['PENDING', 'PAID'] },
              settledAt: { type: ['string', 'null'], format: 'date-time', description: 'Set when PAID' },
            },
          },
        },
      },
    },
    ExpenseWithSplit: {
      allOf: [
        ref.schema('Expense'),
        {
          type: 'object',
          required: ['split'],
          properties: {
            split: {
              oneOf: [ref.schema('ExpenseSplit'), { type: 'null' }],
              description: 'null for a normal personal expense',
            },
          },
        },
      ],
    },
    ExpenseWithSplitResponse: {
      type: 'object',
      required: ['expense'],
      properties: { expense: ref.schema('ExpenseWithSplit') },
    },
    UpdateExpenseRequest: {
      type: 'object',
      description: 'Send only the fields to change; at least one is required. Send `description: null` to clear it.',
      minProperties: 1,
      properties: {
        amount,
        categoryId: { type: 'string', format: 'uuid', description: 'Must be one of your own categories' },
        expenseDate: { type: 'string', format: 'date', description: 'YYYY-MM-DD, a real calendar date' },
        description,
      },
      example: { amount: 45, description: 'Weekly shopping + snacks' },
    },
  },

  paths: {
    '/expenses': {
      get: {
        tags: ['Expenses'],
        summary: 'List expenses',
        description:
          'Paginated, newest first (by expense date, then creation time). All filters are optional and combine with AND.',
        operationId: 'listExpenses',
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Page size',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
          {
            name: 'categoryId',
            in: 'query',
            required: false,
            description: 'Only expenses in this category',
            schema: { type: 'string', format: 'uuid' },
          },
          ref.parameter('FromDateQuery'),
          ref.parameter('ToDateQuery'),
          {
            name: 'search',
            in: 'query',
            required: false,
            description: 'Case-insensitive substring match on the description (trimmed; `%` and `_` match literally)',
            schema: { type: 'string', minLength: 1, maxLength: 100 },
            example: 'shopping',
          },
        ],
        responses: {
          200: {
            description: 'A page of expenses. Each has `split`: the split summary, or null for a personal expense.',
            content: {
              'application/json': {
                schema: ref.schema('ExpenseListResponse'),
                example: {
                  expenses: [exampleSplitExpense, { ...exampleExpense, split: null }],
                  pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
                },
              },
            },
          },
          400: errorResponse('Invalid query parameters', {
            code: 'BAD_REQUEST',
            message: 'Invalid query parameters',
            details: { limit: ['limit must be a whole number between 1 and 100'] },
          }),
          401: ref.response('Unauthorized'),
          500: ref.response('InternalError'),
        },
      },
      post: {
        tags: ['Expenses'],
        summary: 'Create an expense',
        description:
          'Creates a personal expense, or a split expense when `split` is given. `amount` is always the total you paid. ' +
          'A split expense and its participants are saved together in one transaction; if anything fails, nothing is saved. ' +
          'New participants start as PENDING.',
        operationId: 'createExpense',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref.schema('CreateExpenseRequest'),
              examples: {
                personal: {
                  summary: 'Personal expense (no split)',
                  value: { amount: 42.5, categoryId: exampleCategoryId, expenseDate: '2026-09-20', description: 'Weekly shopping' },
                },
                custom: {
                  summary: 'CUSTOM split: 1200 = Rahul 500 + Priya 300 + you 400',
                  value: {
                    ...splitRequestBase,
                    split: {
                      method: 'CUSTOM',
                      participants: [
                        { contactId: rahulId, shareAmount: 500 },
                        { contactId: priyaId, shareAmount: 300 },
                      ],
                    },
                  },
                },
                equal: {
                  summary: 'EQUAL split: 1000 = 333.33 + 333.33 + you 333.34',
                  value: {
                    ...splitRequestBase,
                    amount: 1000,
                    split: { method: 'EQUAL', participants: [{ contactId: rahulId }, { contactId: priyaId }] },
                  },
                },
                percentage: {
                  summary: 'PERCENTAGE split: 1200 = Rahul 40% (480) + Priya 25% (300) + you 35% (420)',
                  value: {
                    ...splitRequestBase,
                    split: {
                      method: 'PERCENTAGE',
                      participants: [
                        { contactId: rahulId, percentage: 40 },
                        { contactId: priyaId, percentage: 25 },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Expense created. `split` is null for a personal expense.',
            content: {
              'application/json': {
                schema: ref.schema('ExpenseWithSplitResponse'),
                examples: {
                  custom: { summary: 'CUSTOM split', value: { expense: exampleSplitExpense } },
                  personal: { summary: 'Personal expense', value: { expense: { ...exampleExpense, split: null } } },
                },
              },
            },
          },
          400: {
            description:
              'Validation failed, body is not valid JSON, `categoryId` is not one of your categories, ' +
              'or the split is invalid. All split errors are reported under `details.split`.',
            content: {
              'application/json': {
                schema: ref.schema('Error'),
                examples: {
                  category: {
                    summary: 'Category not found',
                    value: { code: 'BAD_REQUEST', message: 'Validation failed', details: { categoryId: ['Category not found'] } },
                  },
                  contact: {
                    summary: "Contact not found (or another user's contact)",
                    value: { code: 'BAD_REQUEST', message: 'Validation failed', details: { split: ['Participant 2: contact not found'] } },
                  },
                  fields: {
                    summary: 'Wrong fields for the method',
                    value: {
                      code: 'BAD_REQUEST',
                      message: 'Validation failed',
                      details: { split: ['Participant 1: shareAmount is required for CUSTOM splits'] },
                    },
                  },
                  duplicate: {
                    summary: 'Same contact twice',
                    value: {
                      code: 'BAD_REQUEST',
                      message: 'Validation failed',
                      details: { split: ['Participant 2: the same contact is listed more than once'] },
                    },
                  },
                  exceeds: {
                    summary: 'CUSTOM shares exceed the amount',
                    value: {
                      code: 'BAD_REQUEST',
                      message: 'Validation failed',
                      details: { split: ['Participant shares (1300.00) exceed the expense amount (1200.00)'] },
                    },
                  },
                  percentage: {
                    summary: 'Percentages over 100',
                    value: {
                      code: 'BAD_REQUEST',
                      message: 'Validation failed',
                      details: { split: ['Participant percentages add up to 110, which is more than 100'] },
                    },
                  },
                  tooSmall: {
                    summary: 'Amount too small to split',
                    value: {
                      code: 'BAD_REQUEST',
                      message: 'Validation failed',
                      details: { split: ['0.02 is too small to split equally between 3 people; each needs at least 0.01'] },
                    },
                  },
                },
              },
            },
          },
          401: ref.response('Unauthorized'),
          500: ref.response('InternalError'),
        },
      },
    },

    '/expenses/{id}': {
      parameters: [ref.parameter('IdParam')],
      get: {
        tags: ['Expenses'],
        summary: 'Get an expense',
        operationId: 'getExpense',
        responses: {
          200: {
            description: 'The expense. `split` is null for a personal expense.',
            content: {
              'application/json': {
                schema: ref.schema('ExpenseWithSplitResponse'),
                examples: {
                  split: { summary: 'Split expense', value: { expense: exampleSplitExpense } },
                  personal: { summary: 'Personal expense', value: { expense: { ...exampleExpense, split: null } } },
                },
              },
            },
          },
          400: invalidId,
          401: ref.response('Unauthorized'),
          404: notFound,
          500: ref.response('InternalError'),
        },
      },
      patch: {
        tags: ['Expenses'],
        summary: 'Update an expense',
        description:
          'Partial update: only the fields sent are changed. A personal expense behaves as it always has.\n\n' +
          '**Changing the amount of a split expense** also updates its split, in one transaction:\n' +
          '- **EQUAL**: shares are divided again for the new amount (you get any leftover paise).\n' +
          '- **PERCENTAGE**: percentages stay the same; shares are recalculated from the new amount.\n' +
          '- **CUSTOM**: participant shares stay the same and your own share absorbs the difference. ' +
          "The amount can't go below the participants' total (400, `details.amount`).\n\n" +
          '**Settled splits:** while any participant is PAID the amount cannot change (409). ' +
          '`description`, `categoryId` and `expenseDate` stay editable, and re-sending the current amount is not a change.',
        operationId: 'updateExpense',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: ref.schema('UpdateExpenseRequest') } },
        },
        responses: {
          200: {
            description: 'Expense updated. `split` is null for a personal expense; the same shape as GET /expenses/{id}.',
            content: {
              'application/json': {
                schema: ref.schema('ExpenseWithSplitResponse'),
                examples: {
                  split: { summary: 'Split expense', value: { expense: exampleSplitExpense } },
                  personal: { summary: 'Personal expense', value: { expense: { ...exampleExpense, split: null } } },
                },
              },
            },
          },
          400: {
            description:
              'Invalid `id`, empty body, validation failed, `categoryId` is not one of your categories, ' +
              'or the new amount cannot carry the split',
            content: {
              'application/json': {
                schema: ref.schema('Error'),
                examples: {
                  empty: { summary: 'Empty body', value: { code: 'BAD_REQUEST', message: 'Provide at least one field to update' } },
                  custom: {
                    summary: 'CUSTOM: amount below the participants\' total',
                    value: {
                      code: 'BAD_REQUEST',
                      message: 'Validation failed',
                      details: { amount: ["Amount can't be less than the participants' shares (800.00)"] },
                    },
                  },
                  equal: {
                    summary: 'EQUAL: amount too small to split',
                    value: {
                      code: 'BAD_REQUEST',
                      message: 'Validation failed',
                      details: { amount: ['0.02 is too small to split equally between 3 people; each needs at least 0.01'] },
                    },
                  },
                },
              },
            },
          },
          401: ref.response('Unauthorized'),
          404: notFound,
          409: errorResponse('The amount of a split with PAID participants cannot change', {
            code: 'CONFLICT',
            message: 'This split has settled participants; mark them as pending before changing the split or the amount',
          }),
          500: ref.response('InternalError'),
        },
      },
      delete: {
        tags: ['Expenses'],
        summary: 'Delete an expense',
        operationId: 'deleteExpense',
        responses: {
          204: { description: 'Expense deleted' },
          400: invalidId,
          401: ref.response('Unauthorized'),
          404: notFound,
          500: ref.response('InternalError'),
        },
      },
    },

    '/expenses/{id}/split': {
      parameters: [ref.parameter('IdParam')],
      put: {
        tags: ['Expenses'],
        summary: 'Create or replace the split of an expense',
        description:
          'Turns a personal expense into a split expense, or replaces the split of a split expense ' +
          '(method and all participants). The body is the split itself, with the same rules as `split` on POST /expenses. ' +
          "Shares are calculated from the expense's current `amount`, which does not change.\n\n" +
          'Replacing a split removes all its participants and creates the new ones (with new participant ids), ' +
          'in one transaction: if anything fails, the original split is kept. New participants start as PENDING.\n\n' +
          'While any participant of the current split is PAID, the split cannot be replaced (409).',
        operationId: 'replaceExpenseSplit',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref.schema('SplitInput'),
              examples: {
                custom: {
                  summary: 'CUSTOM: Rahul 500 + Priya 300, you get the rest',
                  value: { method: 'CUSTOM', participants: [{ contactId: rahulId, shareAmount: 500 }, { contactId: priyaId, shareAmount: 300 }] },
                },
                equal: {
                  summary: 'EQUAL between you, Rahul and Priya',
                  value: { method: 'EQUAL', participants: [{ contactId: rahulId }, { contactId: priyaId }] },
                },
                percentage: {
                  summary: 'PERCENTAGE: Rahul 40%, Priya 25%, you 35%',
                  value: { method: 'PERCENTAGE', participants: [{ contactId: rahulId, percentage: 40 }, { contactId: priyaId, percentage: 25 }] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'The expense with its new split; the same shape as GET /expenses/{id}.',
            content: {
              'application/json': {
                schema: ref.schema('ExpenseWithSplitResponse'),
                example: { expense: exampleSplitExpense },
              },
            },
          },
          400: {
            description:
              'Invalid `id`, or the split is invalid. Errors are reported under `details.method` / `details.participants`.',
            content: {
              'application/json': {
                schema: ref.schema('Error'),
                examples: {
                  contact: {
                    summary: "Contact not found (or another user's contact)",
                    value: { code: 'BAD_REQUEST', message: 'Validation failed', details: { participants: ['Participant 2: contact not found'] } },
                  },
                  duplicate: {
                    summary: 'Same contact twice',
                    value: {
                      code: 'BAD_REQUEST',
                      message: 'Validation failed',
                      details: { participants: ['Participant 2: the same contact is listed more than once'] },
                    },
                  },
                  fields: {
                    summary: 'Wrong fields for the method',
                    value: {
                      code: 'BAD_REQUEST',
                      message: 'Validation failed',
                      details: { participants: ['Participant 1: percentage is required for PERCENTAGE splits'] },
                    },
                  },
                  exceeds: {
                    summary: 'CUSTOM shares exceed the amount',
                    value: {
                      code: 'BAD_REQUEST',
                      message: 'Validation failed',
                      details: { participants: ['Participant shares (1300.00) exceed the expense amount (1200.00)'] },
                    },
                  },
                  method: {
                    summary: 'Unknown method',
                    value: { code: 'BAD_REQUEST', message: 'Validation failed', details: { method: ['method must be EQUAL, CUSTOM or PERCENTAGE'] } },
                  },
                },
              },
            },
          },
          401: ref.response('Unauthorized'),
          404: notFound,
          409: {
            description: 'A participant of the current split is PAID, so it cannot be replaced',
            content: {
              'application/json': {
                schema: ref.schema('Error'),
                examples: {
                  settled: {
                    summary: 'Settled participants',
                    value: {
                      code: 'CONFLICT',
                      message: 'This split has settled participants; mark them as pending before changing the split or the amount',
                    },
                  },
                  concurrent: {
                    summary: 'Settled by another request meanwhile',
                    value: { code: 'CONFLICT', message: 'The split changed while it was being updated; please try again' },
                  },
                },
              },
            },
          },
          500: ref.response('InternalError'),
        },
      },
      delete: {
        tags: ['Expenses'],
        summary: 'Remove the split (back to a personal expense)',
        description:
          'Turns a split expense back into a normal personal expense: all its participants are removed, in one transaction. ' +
          'The expense itself stays, with the same amount, description, category and date. ' +
          'To delete the whole expense, use DELETE /expenses/{id} instead.\n\n' +
          'While any participant is PAID the split cannot be removed (409).',
        operationId: 'removeExpenseSplit',
        responses: {
          200: {
            description: 'The expense, now personal (`split` is null); the same shape as GET /expenses/{id}.',
            content: {
              'application/json': {
                schema: ref.schema('ExpenseWithSplitResponse'),
                example: { expense: { ...exampleSplitExpense, split: null } },
              },
            },
          },
          400: invalidId,
          401: ref.response('Unauthorized'),
          404: notFound,
          409: {
            description: 'The expense has no split, or a participant is PAID',
            content: {
              'application/json': {
                schema: ref.schema('Error'),
                examples: {
                  personal: {
                    summary: 'Already a personal expense',
                    value: { code: 'CONFLICT', message: 'Expense does not have a split' },
                  },
                  settled: {
                    summary: 'Settled participants',
                    value: {
                      code: 'CONFLICT',
                      message: 'This split has settled participants; mark them as pending before changing the split or the amount',
                    },
                  },
                  concurrent: {
                    summary: 'Settled by another request meanwhile',
                    value: { code: 'CONFLICT', message: 'The split changed while it was being updated; please try again' },
                  },
                },
              },
            },
          },
          500: ref.response('InternalError'),
        },
      },
    },

    '/expenses/{id}/split/participants/{participantId}': {
      parameters: [
        ref.parameter('IdParam'),
        {
          name: 'participantId',
          in: 'path',
          required: true,
          description: 'Participant id (`split.participants[].id`), not the contact id',
          schema: { type: 'string', format: 'uuid' },
          example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        },
      ],
      patch: {
        tags: ['Expenses'],
        summary: "Settle (or un-settle) a participant's share",
        description:
          'Marks one participant of a split expense as PAID (`settledAt` is set to now) or back to PENDING ' +
          '(`settledAt` is cleared). Nothing else changes: not the expense amount, the shares, the percentages or the split method.\n\n' +
          'Sending the status the participant already has changes nothing (a PAID participant keeps its original `settledAt`).\n\n' +
          "A PAID participant can always be set back to PENDING. While anyone is PAID, the expense amount and the split " +
          'itself cannot change (PATCH /expenses/{id} amount, PUT and DELETE /expenses/{id}/split return 409).',
        operationId: 'settleExpenseParticipant',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref.schema('SettlementRequest'),
              examples: {
                paid: { summary: 'Mark as paid', value: { status: 'PAID' } },
                pending: { summary: 'Undo: mark as pending again', value: { status: 'PENDING' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'The expense with its updated split; the same shape as GET /expenses/{id}.',
            content: {
              'application/json': {
                schema: ref.schema('ExpenseWithSplitResponse'),
                example: {
                  expense: {
                    ...exampleSplitExpense,
                    split: {
                      ...exampleSplitExpense.split,
                      owedToYou: 300,
                      settledToYou: 500,
                      participants: [
                        exampleSplitExpense.split.participants[0],
                        { ...exampleSplitExpense.split.participants[1], status: 'PAID', settledAt: '2026-09-22T09:15:00.000Z' },
                      ],
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid `id` / `participantId`, or `status` is missing or not PENDING/PAID',
            content: {
              'application/json': {
                schema: ref.schema('Error'),
                examples: {
                  status: {
                    summary: 'Invalid status',
                    value: { code: 'BAD_REQUEST', message: 'Validation failed', details: { status: ['status must be PENDING or PAID'] } },
                  },
                  participantId: {
                    summary: 'Invalid participantId',
                    value: { code: 'BAD_REQUEST', message: 'Invalid URL parameters', details: { participantId: ['Invalid participantId'] } },
                  },
                },
              },
            },
          },
          401: ref.response('Unauthorized'),
          404: {
            description: "The expense doesn't exist or isn't yours, or the participant isn't on this expense",
            content: {
              'application/json': {
                schema: ref.schema('Error'),
                examples: {
                  expense: { summary: 'Expense not found', value: { code: 'NOT_FOUND', message: 'Expense not found' } },
                  participant: { summary: 'Participant not found', value: { code: 'NOT_FOUND', message: 'Participant not found' } },
                },
              },
            },
          },
          409: {
            description: 'The expense has no split, or the participant was changed by another request meanwhile',
            content: {
              'application/json': {
                schema: ref.schema('Error'),
                examples: {
                  personal: { summary: 'Personal expense', value: { code: 'CONFLICT', message: 'Expense does not have a split' } },
                  concurrent: {
                    summary: 'Changed by another request meanwhile',
                    value: { code: 'CONFLICT', message: 'The split changed while it was being updated; please try again' },
                  },
                },
              },
            },
          },
          500: ref.response('InternalError'),
        },
      },
    },
  },
};
