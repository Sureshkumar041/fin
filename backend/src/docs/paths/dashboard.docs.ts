import type { ApiDocsModule, SchemaObject } from '../types';
import { errorResponse, ref } from '../types';

// validators/common.validator.ts yearMonth
const monthSchema = { type: 'string' as const, pattern: '^\\d{4}-(0[1-9]|1[0-2])$', example: '2026-09' };

const monthlyTotal: SchemaObject = {
  type: 'object',
  required: ['month', 'totalExpense', 'expenseCount', 'totalPaid'],
  properties: {
    month: { type: 'string', description: 'YYYY-MM', example: '2026-09' },
    totalExpense: {
      type: 'number',
      description: 'Your own spending: the amount of personal expenses plus your own share of split expenses',
    },
    expenseCount: { type: 'integer', minimum: 0 },
    totalPaid: {
      type: 'number',
      description: 'Full amounts you paid, including the parts paid on behalf of split participants. Equals totalExpense without splits.',
    },
  },
};

export const dashboardDocs: ApiDocsModule = {
  tag: {
    name: 'Dashboard',
    description:
      "Aggregated totals over the logged-in user's expenses, for charts and summary cards.\n\n" +
      '**Split expenses:** `totalExpense` is always your own spending (personal amounts plus your own share of split bills). ' +
      '`totalPaid` is what you actually paid, including other people\'s shares, and `owedToYou` / `settledToYou` are those shares ' +
      'still pending / paid back. Settling a share never changes `totalExpense` or `totalPaid`. ' +
      'An expense counts in the month of its expense date, whenever it is settled.',
  },

  schemas: {
    MonthlyTotal: monthlyTotal,
    DashboardSummary: {
      type: 'object',
      required: ['totalExpense', 'expenseCount', 'currentMonth', 'totalPaid', 'owedToYou', 'settledToYou'],
      properties: {
        totalExpense: { type: 'number', description: 'All-time own spending (your share of split expenses)' },
        expenseCount: { type: 'integer', minimum: 0, description: 'All-time count' },
        currentMonth: ref.schema('MonthlyTotal'),
        totalPaid: { type: 'number', description: 'All-time full amounts paid, including split participants\' shares' },
        owedToYou: { type: 'number', minimum: 0, description: 'Split participants\' shares still PENDING (all time)' },
        settledToYou: { type: 'number', minimum: 0, description: 'Split participants\' shares already PAID back (all time)' },
      },
    },
    DashboardSummaryResponse: {
      type: 'object',
      required: ['summary'],
      properties: { summary: ref.schema('DashboardSummary') },
    },
    DashboardMonthlyResponse: {
      type: 'object',
      required: ['from', 'to', 'months'],
      properties: {
        from: { type: 'string', description: 'First month of the range (YYYY-MM)' },
        to: { type: 'string', description: 'Last month of the range (YYYY-MM)' },
        months: {
          type: 'array',
          description: 'One entry per month, oldest first. Months with no expenses have zero totals.',
          items: ref.schema('MonthlyTotal'),
        },
      },
    },
    CategoryTotal: {
      type: 'object',
      required: ['id', 'name', 'totalExpense', 'expenseCount', 'totalPaid', 'percentage'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        totalExpense: { type: 'number', description: 'Own spending in this category' },
        expenseCount: { type: 'integer', minimum: 0 },
        totalPaid: { type: 'number', description: 'Full amounts paid in this category' },
        percentage: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Share of `totalExpense` across all categories, 2 decimal places; 0 when nothing was spent',
        },
      },
    },
    DashboardCategoriesResponse: {
      type: 'object',
      required: ['from', 'to', 'totalExpense', 'totalPaid', 'categories'],
      properties: {
        from: { type: ['string', 'null'], format: 'date', description: 'Echo of the `from` query, or null' },
        to: { type: ['string', 'null'], format: 'date', description: 'Echo of the `to` query, or null' },
        totalExpense: { type: 'number', description: 'Own spending across all categories in the range' },
        totalPaid: { type: 'number', description: 'Full amounts paid across all categories in the range' },
        categories: {
          type: 'array',
          description:
            'Every category of the user, including ones with no expenses in the range. Sorted by total (highest first), then name.',
          items: ref.schema('CategoryTotal'),
        },
      },
    },
  },

  paths: {
    '/dashboard/summary': {
      get: {
        tags: ['Dashboard'],
        summary: 'All-time and current-month totals',
        operationId: 'getDashboardSummary',
        parameters: [
          {
            name: 'month',
            in: 'query',
            required: false,
            description:
              "Which month counts as \"current\" (YYYY-MM). Lets the client use the user's time zone; defaults to the server's current month.",
            schema: monthSchema,
          },
        ],
        responses: {
          200: {
            description: 'The summary',
            content: {
              'application/json': {
                schema: ref.schema('DashboardSummaryResponse'),
                example: {
                  summary: {
                    totalExpense: 1520.75,
                    expenseCount: 38,
                    currentMonth: { month: '2026-09', totalExpense: 312.4, expenseCount: 9, totalPaid: 1112.4 },
                    totalPaid: 2320.75,
                    owedToYou: 300,
                    settledToYou: 500,
                  },
                },
              },
            },
          },
          400: errorResponse('`month` is not in YYYY-MM format', {
            code: 'BAD_REQUEST',
            message: 'Invalid query parameters',
            details: { month: ['Month must be in YYYY-MM format'] },
          }),
          401: ref.response('Unauthorized'),
          500: ref.response('InternalError'),
        },
      },
    },

    '/dashboard/monthly': {
      get: {
        tags: ['Dashboard'],
        summary: 'Totals per month',
        description: 'A continuous series of `months` months ending at `month` (inclusive).',
        operationId: 'getDashboardMonthly',
        parameters: [
          {
            name: 'month',
            in: 'query',
            required: false,
            description: "Last month of the range (YYYY-MM). Defaults to the server's current month.",
            schema: monthSchema,
          },
          {
            name: 'months',
            in: 'query',
            required: false,
            description: 'How many months to return',
            schema: { type: 'integer', minimum: 1, maximum: 36, default: 12 },
          },
        ],
        responses: {
          200: {
            description: 'Monthly totals',
            content: {
              'application/json': {
                schema: ref.schema('DashboardMonthlyResponse'),
                example: {
                  from: '2026-07',
                  to: '2026-09',
                  months: [
                    { month: '2026-07', totalExpense: 410.2, expenseCount: 12, totalPaid: 410.2 },
                    { month: '2026-08', totalExpense: 0, expenseCount: 0, totalPaid: 0 },
                    { month: '2026-09', totalExpense: 312.4, expenseCount: 9, totalPaid: 1112.4 },
                  ],
                },
              },
            },
          },
          400: errorResponse('Invalid `month` or `months`', {
            code: 'BAD_REQUEST',
            message: 'Invalid query parameters',
            details: { months: ['months must be a whole number between 1 and 36'] },
          }),
          401: ref.response('Unauthorized'),
          500: ref.response('InternalError'),
        },
      },
    },

    '/dashboard/categories': {
      get: {
        tags: ['Dashboard'],
        summary: 'Totals per category',
        description: 'Spending per category in an optional date range. Without `from`/`to`, covers all time.',
        operationId: 'getDashboardCategories',
        parameters: [ref.parameter('FromDateQuery'), ref.parameter('ToDateQuery')],
        responses: {
          200: {
            description: 'Category totals',
            content: {
              'application/json': {
                schema: ref.schema('DashboardCategoriesResponse'),
                example: {
                  from: '2026-09-01',
                  to: '2026-09-30',
                  totalExpense: 312.4,
                  totalPaid: 1112.4,
                  categories: [
                    {
                      id: '3f1c2a4e-8b7d-4c6a-9e2f-1a2b3c4d5e6f',
                      name: 'Groceries',
                      totalExpense: 250,
                      expenseCount: 6,
                      totalPaid: 1050,
                      percentage: 80.03,
                    },
                    {
                      id: '5a6b7c8d-1e2f-4a3b-8c4d-9e0f1a2b3c4d',
                      name: 'Transport',
                      totalExpense: 62.4,
                      expenseCount: 3,
                      totalPaid: 62.4,
                      percentage: 19.97,
                    },
                  ],
                },
              },
            },
          },
          400: errorResponse('Invalid date, or `from` is after `to`', {
            code: 'BAD_REQUEST',
            message: 'Invalid query parameters',
            details: { from: ['"from" must be on or before "to"'] },
          }),
          401: ref.response('Unauthorized'),
          500: ref.response('InternalError'),
        },
      },
    },
  },
};
