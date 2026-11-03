import type { ApiDocsModule, SchemaObject } from '../types';
import { errorResponse, ref } from '../types';
import { addDays } from '../../utils/month';

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

// --- Insights ---------------------------------------------------------------

const dateSchema = { type: 'string' as const, format: 'date', example: '2026-09-24' };

// The totals every insights month, period, day and week carries.
const totalsRequired = ['totalExpense', 'totalPaid', 'othersShare', 'expenseCount'];
const totalsProperties: Record<string, SchemaObject> = {
  totalExpense: {
    type: 'number',
    description: 'Your own spending: the amount of personal expenses plus your own share of split expenses',
  },
  totalPaid: {
    type: 'number',
    description: 'Full amounts you paid, including the parts paid on behalf of split participants',
  },
  othersShare: {
    type: 'number',
    minimum: 0,
    description: '`totalPaid − totalExpense`: the part paid for split participants, whether settled or not',
  },
  expenseCount: { type: 'integer', minimum: 0 },
};

const totals = (extra: Record<string, SchemaObject>, required: string[], description?: string): SchemaObject => ({
  type: 'object',
  ...(description ? { description } : {}),
  required: [...required, ...totalsRequired],
  properties: { ...extra, ...totalsProperties },
});

// services/observation.service.ts OBSERVATION_CODES, in output order.
const observationCodes = [
  'NO_SPENDING',
  'SPENDING_INCREASED',
  'SPENDING_DECREASED',
  'SPENDING_UNCHANGED',
  'TOP_CATEGORY',
  'CATEGORY_INCREASED',
  'CATEGORY_DECREASED',
  'CATEGORY_NEW',
  'OTHERS_SHARE',
  'BUSIEST_WEEKDAY',
];

const observationDescription =
  'A short, rule-based statement about the numbers in this response. Observations are returned in the order of ' +
  '`code` below, each code at most once; rules without enough data return nothing. `message` is English display ' +
  'text without money amounts (the backend does not know the display currency): the exact values are in `data`.\n\n' +
  '`data.comparison` is `samePeriod` while the month is in progress and `fullMonth` once it is complete.\n\n' +
  '| code | tone | when | data |\n' +
  '|---|---|---|---|\n' +
  '| `NO_SPENDING` | neutral | Nothing spent so far this month. The spending comparison and category rules are then skipped. | `from`, `to`, `totalPaid` |\n' +
  '| `SPENDING_INCREASED` / `SPENDING_DECREASED` / `SPENDING_UNCHANGED` | negative / positive / neutral | Spending vs the previous month (same days while in progress). Needs at least 7 days of the month and spending in the previous period; under 5% is "unchanged". | `comparison`, `percentage`, `amount`, `currentTotalExpense`, `previousTotalExpense`, `previousFrom`, `previousTo` |\n' +
  '| `TOP_CATEGORY` | neutral | The highest spending category of the month. | `categoryId`, `categoryName`, `totalExpense`, `percentage` |\n' +
  '| `CATEGORY_INCREASED` / `CATEGORY_DECREASED` | negative / positive | The biggest increase / decrease over the same days: at least 20% and at least 10% of the month\'s spending. Needs 7 days and at least two categories. | `comparison`, `categoryId`, `categoryName`, `percentage`, `amount`, `currentTotalExpense`, `previousTotalExpense` |\n' +
  '| `CATEGORY_NEW` | neutral | Spending this month in a category with none in the whole previous month (which had some spending). | `categoryId`, `categoryName`, `totalExpense`, `newCategoryCount` |\n' +
  '| `OTHERS_SHARE` | neutral | Part of this month\'s payments covered split participants\' shares. | `percentage` (of `totalPaid`), `othersShare`, `totalPaid` |\n' +
  '| `BUSIEST_WEEKDAY` | neutral | One weekday clearly leads the 12-week pattern: spending in at least 4 weeks, no tie, at least 20% of the spending. | `weekday` (1 = Monday), `percentage`, `totalExpense`, `averageExpense`, `from`, `to` |';

const moneyChange: SchemaObject = {
  type: 'object',
  description: 'Current minus previous',
  required: ['amount', 'percentage'],
  properties: {
    amount: { type: 'number', description: 'Difference in money (negative = less than before)' },
    percentage: {
      type: ['number', 'null'],
      description: 'Change in percent, 2 decimal places. null when the previous value is 0: nothing to compare against.',
    },
  },
};

const insightsSchemas: Record<string, SchemaObject> = {
  InsightMoneyChange: moneyChange,
  InsightTotalsChange: {
    type: 'object',
    required: ['totalExpense', 'totalPaid', 'othersShare'],
    properties: {
      totalExpense: ref.schema('InsightMoneyChange'),
      totalPaid: ref.schema('InsightMoneyChange'),
      othersShare: ref.schema('InsightMoneyChange'),
    },
  },
  InsightMonthTotals: totals({ month: monthSchema }, ['month'], 'Totals for a whole month'),
  InsightPeriodTotals: totals(
    {
      from: { ...dateSchema, description: 'First day, inclusive' },
      to: { ...dateSchema, description: 'Last day, inclusive' },
    },
    ['from', 'to'],
    'Totals for a range of days',
  ),
  InsightCategorySummary: {
    type: 'object',
    required: ['id', 'name', 'totalExpense', 'percentage'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      totalExpense: { type: 'number', description: 'Own spending in this category this month' },
      percentage: { type: 'number', minimum: 0, maximum: 100, description: 'Share of the month\'s own spending' },
    },
  },
  InsightCategory: {
    type: 'object',
    description:
      'A category with spending in this month or the previous one. The first six fields are the same as `/dashboard/categories` for the whole month.',
    required: ['id', 'name', 'totalExpense', 'expenseCount', 'totalPaid', 'percentage', 'fullMonth', 'samePeriod'],
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      totalExpense: { type: 'number', description: 'Own spending in this category this month' },
      expenseCount: { type: 'integer', minimum: 0 },
      totalPaid: { type: 'number', description: 'Full amounts paid in this category this month' },
      percentage: { type: 'number', minimum: 0, maximum: 100, description: 'Share of the month\'s own spending' },
      fullMonth: {
        type: 'object',
        description: 'Whole month vs whole previous month',
        required: ['previousTotalExpense', 'change'],
        properties: {
          previousTotalExpense: { type: 'number' },
          change: ref.schema('InsightMoneyChange'),
        },
      },
      samePeriod: {
        type: 'object',
        description: 'Own spending over `samePeriod.current` vs `samePeriod.previous`',
        required: ['totalExpense', 'previousTotalExpense', 'change'],
        properties: {
          totalExpense: { type: 'number' },
          previousTotalExpense: { type: 'number' },
          change: ref.schema('InsightMoneyChange'),
        },
      },
    },
  },
  InsightDay: totals({ date: dateSchema }, ['date']),
  InsightWeek: totals(
    {
      weekStart: { ...dateSchema, description: 'Monday' },
      weekEnd: { ...dateSchema, description: 'Sunday' },
    },
    ['weekStart', 'weekEnd'],
  ),
  InsightWeekday: totals(
    {
      weekday: { type: 'integer', minimum: 1, maximum: 7, description: 'ISO weekday: 1 = Monday ... 7 = Sunday' },
      averageExpense: { type: 'number', description: 'Own spending on this weekday in an average week of the 12' },
    },
    ['weekday', 'averageExpense'],
    'One weekday summed over the 12 weeks',
  ),
  InsightMonthlyTotal: {
    ...monthlyTotal,
    required: [...(monthlyTotal.required ?? []), 'othersShare'],
    properties: { ...monthlyTotal.properties, othersShare: totalsProperties.othersShare },
  },
  InsightObservation: {
    type: 'object',
    description: observationDescription,
    required: ['code', 'tone', 'message', 'data'],
    properties: {
      code: { type: 'string', enum: observationCodes },
      tone: {
        type: 'string',
        enum: ['positive', 'negative', 'neutral'],
        description: 'For spending, up is bad: an increase is `negative`, a decrease `positive`',
      },
      message: { type: 'string', example: "You've spent 18% more than at this point in October." },
      data: {
        type: 'object',
        description: 'Raw values behind the message; the keys depend on `code` (see the table above)',
        additionalProperties: { type: ['string', 'number', 'null'] },
      },
    },
  },
  DashboardInsightsResponse: {
    type: 'object',
    required: [
      'month',
      'previousMonth',
      'date',
      'monthComplete',
      'overview',
      'samePeriod',
      'categories',
      'trends',
      'observations',
    ],
    properties: {
      month: { ...monthSchema, description: 'The month the insights are for' },
      previousMonth: { ...monthSchema, example: '2026-08' },
      date: { ...dateSchema, description: 'The `date` used (the user\'s today)' },
      monthComplete: {
        type: 'boolean',
        description:
          'false while the month is in progress (`date` is in it, before its last day). Then `overview` compares a partial month with a whole one and `samePeriod` is the fair comparison. When true, the two are the same.',
      },
      overview: {
        type: 'object',
        description: 'Whole month vs whole previous month, the same totals as `/dashboard/summary` and `/dashboard/monthly`',
        required: ['current', 'previous', 'change'],
        properties: {
          current: ref.schema('InsightMonthTotals'),
          previous: ref.schema('InsightMonthTotals'),
          change: ref.schema('InsightTotalsChange'),
        },
      },
      samePeriod: {
        type: 'object',
        description:
          'Days 1 to N of the month vs days 1 to N of the previous month, where N is the day of `date` (capped at the shorter month). A complete month is compared with the whole previous month.',
        required: ['current', 'previous', 'change'],
        properties: {
          current: ref.schema('InsightPeriodTotals'),
          previous: ref.schema('InsightPeriodTotals'),
          change: ref.schema('InsightTotalsChange'),
        },
      },
      categories: {
        type: 'object',
        required: ['highest', 'top', 'items'],
        properties: {
          highest: {
            oneOf: [ref.schema('InsightCategorySummary'), { type: 'null' }],
            description: 'The highest spending category this month; null with no spending',
          },
          top: {
            type: 'array',
            maxItems: 3,
            description: 'Up to three categories with spending this month, highest first',
            items: ref.schema('InsightCategorySummary'),
          },
          items: {
            type: 'array',
            description:
              'Categories with spending in this month or the previous one, sorted by this month\'s spending (highest first), then name',
            items: ref.schema('InsightCategory'),
          },
        },
      },
      trends: {
        type: 'object',
        required: ['daily', 'weekly', 'monthly'],
        properties: {
          daily: {
            type: 'array',
            description:
              'Every day of the month, oldest first; days without expenses have zero totals. Days after `date` are 0 unless an expense is dated in the future.',
            items: ref.schema('InsightDay'),
          },
          weekly: {
            type: 'object',
            description:
              'The 12 whole Monday-Sunday weeks ending on or before `date` (or the month\'s last day, if earlier). The week in progress is left out.',
            required: ['from', 'to', 'weeks', 'weekdays'],
            properties: {
              from: { ...dateSchema, description: 'First Monday, inclusive' },
              to: { ...dateSchema, description: 'Last Sunday, inclusive' },
              weeks: { type: 'array', minItems: 12, maxItems: 12, items: ref.schema('InsightWeek') },
              weekdays: {
                type: 'array',
                minItems: 7,
                maxItems: 7,
                description: 'Monday to Sunday',
                items: ref.schema('InsightWeekday'),
              },
            },
          },
          monthly: {
            type: 'object',
            description: 'The 12 months ending at `month`: `/dashboard/monthly` plus `othersShare`',
            required: ['from', 'to', 'months'],
            properties: {
              from: monthSchema,
              to: monthSchema,
              months: { type: 'array', items: ref.schema('InsightMonthlyTotal') },
            },
          },
        },
      },
      observations: { type: 'array', items: ref.schema('InsightObservation') },
    },
  },
};

// Examples: one user, September in progress on the 24th, and an empty month.
const zero = { totalExpense: 0, totalPaid: 0, othersShare: 0, expenseCount: 0 };
const noChange = { amount: 0, percentage: null };
// 12 weeks from a Monday; `spent` gives own spending (= amount paid) by week start.
const twelveWeeks = (from: string, spent: Record<string, number> = {}) =>
  Array.from({ length: 12 }, (_, i) => {
    const weekStart = addDays(from, i * 7);
    const total = spent[weekStart] ?? 0;
    return {
      weekStart,
      weekEnd: addDays(weekStart, 6),
      totalExpense: total,
      totalPaid: total,
      othersShare: 0,
      expenseCount: total > 0 ? 1 : 0,
    };
  });
const weekdays = (spent: Record<number, number>) =>
  Array.from({ length: 7 }, (_, i) => {
    const total = spent[i + 1] ?? 0;
    return {
      weekday: i + 1,
      totalExpense: total,
      totalPaid: total,
      othersShare: 0,
      expenseCount: total > 0 ? 1 : 0,
      averageExpense: Math.round((total / 12) * 100) / 100,
    };
  });

const travel = { id: '82897904-8aea-45ae-a7ae-7726709c2223', name: 'Travel' };
const groceries = { id: '8a99c6fa-224d-4434-a4cd-711d42a4b27a', name: 'Groceries' };

const insightsExample = {
  month: '2026-09',
  previousMonth: '2026-08',
  date: '2026-09-24',
  monthComplete: false,
  overview: {
    current: { month: '2026-09', totalExpense: 614.5, totalPaid: 818, othersShare: 203.5, expenseCount: 4 },
    previous: { month: '2026-08', totalExpense: 350, totalPaid: 350, othersShare: 0, expenseCount: 1 },
    change: {
      totalExpense: { amount: 264.5, percentage: 75.57 },
      totalPaid: { amount: 468, percentage: 133.71 },
      othersShare: { amount: 203.5, percentage: null },
    },
  },
  samePeriod: {
    current: { from: '2026-09-01', to: '2026-09-24', totalExpense: 614.5, totalPaid: 818, othersShare: 203.5, expenseCount: 4 },
    previous: { from: '2026-08-01', to: '2026-08-24', totalExpense: 350, totalPaid: 350, othersShare: 0, expenseCount: 1 },
    change: {
      totalExpense: { amount: 264.5, percentage: 75.57 },
      totalPaid: { amount: 468, percentage: 133.71 },
      othersShare: { amount: 203.5, percentage: null },
    },
  },
  categories: {
    highest: { ...travel, totalExpense: 350, percentage: 56.96 },
    top: [
      { ...travel, totalExpense: 350, percentage: 56.96 },
      { ...groceries, totalExpense: 264.5, percentage: 43.04 },
    ],
    items: [
      {
        ...travel,
        totalExpense: 350,
        expenseCount: 1,
        totalPaid: 350,
        percentage: 56.96,
        fullMonth: { previousTotalExpense: 350, change: { amount: 0, percentage: 0 } },
        samePeriod: { totalExpense: 350, previousTotalExpense: 350, change: { amount: 0, percentage: 0 } },
      },
      {
        ...groceries,
        totalExpense: 264.5,
        expenseCount: 3,
        totalPaid: 468,
        percentage: 43.04,
        fullMonth: { previousTotalExpense: 0, change: { amount: 264.5, percentage: null } },
        samePeriod: { totalExpense: 264.5, previousTotalExpense: 0, change: { amount: 264.5, percentage: null } },
      },
    ],
  },
  trends: {
    // Shortened: the API returns every day of the month.
    daily: [
      { date: '2026-09-01', ...zero },
      { date: '2026-09-14', totalExpense: 350, totalPaid: 350, othersShare: 0, expenseCount: 1 },
      { date: '2026-09-23', totalExpense: 221.5, totalPaid: 253, othersShare: 31.5, expenseCount: 2 },
      { date: '2026-09-24', totalExpense: 43, totalPaid: 215, othersShare: 172, expenseCount: 1 },
      { date: '2026-09-30', ...zero },
    ],
    weekly: {
      from: '2026-06-29',
      to: '2026-09-20',
      weeks: twelveWeeks('2026-06-29', { '2026-08-03': 350, '2026-09-14': 350 }),
      weekdays: weekdays({ 1: 350, 7: 350 }),
    },
    monthly: {
      from: '2025-10',
      to: '2026-09',
      months: [
        { month: '2026-08', totalExpense: 350, expenseCount: 1, totalPaid: 350, othersShare: 0 },
        { month: '2026-09', totalExpense: 614.5, expenseCount: 4, totalPaid: 818, othersShare: 203.5 },
      ],
    },
  },
  observations: [
    {
      code: 'SPENDING_INCREASED',
      tone: 'negative',
      message: "You've spent 76% more than at this point in August.",
      data: {
        comparison: 'samePeriod',
        percentage: 75.57,
        amount: 264.5,
        currentTotalExpense: 614.5,
        previousTotalExpense: 350,
        previousFrom: '2026-08-01',
        previousTo: '2026-08-24',
      },
    },
    {
      code: 'TOP_CATEGORY',
      tone: 'neutral',
      message: 'Travel is your top category this month, at 57% of your spending.',
      data: { categoryId: travel.id, categoryName: 'Travel', totalExpense: 350, percentage: 56.96 },
    },
    {
      code: 'CATEGORY_NEW',
      tone: 'neutral',
      message: "Groceries is new this month: you didn't spend on it in August.",
      data: { categoryId: groceries.id, categoryName: 'Groceries', totalExpense: 264.5, newCategoryCount: 1 },
    },
    {
      code: 'OTHERS_SHARE',
      tone: 'neutral',
      message: "25% of what you've paid this month covered other people's shares.",
      data: { percentage: 24.88, othersShare: 203.5, totalPaid: 818 },
    },
  ],
};

const emptyMonthExample = {
  month: '2026-11',
  previousMonth: '2026-10',
  date: '2026-11-03',
  monthComplete: false,
  overview: {
    current: { month: '2026-11', ...zero },
    previous: { month: '2026-10', ...zero },
    change: { totalExpense: noChange, totalPaid: noChange, othersShare: noChange },
  },
  samePeriod: {
    current: { from: '2026-11-01', to: '2026-11-03', ...zero },
    previous: { from: '2026-10-01', to: '2026-10-03', ...zero },
    change: { totalExpense: noChange, totalPaid: noChange, othersShare: noChange },
  },
  categories: { highest: null, top: [], items: [] },
  trends: {
    // Shortened: the API returns every day of the month.
    daily: [
      { date: '2026-11-01', ...zero },
      { date: '2026-11-30', ...zero },
    ],
    weekly: {
      from: '2026-08-10',
      to: '2026-11-01',
      weeks: twelveWeeks('2026-08-10'),
      weekdays: weekdays({}),
    },
    monthly: {
      from: '2025-12',
      to: '2026-11',
      months: [
        { month: '2026-10', totalExpense: 0, expenseCount: 0, totalPaid: 0, othersShare: 0 },
        { month: '2026-11', totalExpense: 0, expenseCount: 0, totalPaid: 0, othersShare: 0 },
      ],
    },
  },
  observations: [
    {
      code: 'NO_SPENDING',
      tone: 'neutral',
      message: "You haven't spent anything this month up to 3 November.",
      data: { from: '2026-11-01', to: '2026-11-03', totalPaid: 0 },
    },
  ],
};

export const dashboardDocs: ApiDocsModule = {
  tag: {
    name: 'Dashboard',
    description:
      "Aggregated totals over the logged-in user's expenses, for charts and summary cards.\n\n" +
      '**Split expenses:** `totalExpense` is always your own spending (personal amounts plus your own share of split bills). ' +
      '`totalPaid` is what you actually paid, including other people\'s shares, and `owedToYou` / `settledToYou` are those shares ' +
      'still pending / paid back. `othersShare` (insights) is `totalPaid − totalExpense`. ' +
      'Settling a share never changes `totalExpense`, `totalPaid` or `othersShare`. ' +
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
    ...insightsSchemas,
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

    '/dashboard/insights': {
      get: {
        tags: ['Dashboard'],
        summary: 'Financial insights for a month',
        description:
          'Everything the Insights page needs in one response, from the same calculations as the other dashboard endpoints:\n\n' +
          '- `overview`: the whole month vs the whole previous month.\n' +
          '- `samePeriod`: the days of the month up to `date` vs the same days of the previous month, so a month in progress is not compared with a whole one.\n' +
          '- `categories`: highest, top three, and every category compared both ways.\n' +
          '- `trends`: every day of the month, the last 12 whole Monday-Sunday weeks (per week and per weekday), and 12 months of history.\n' +
          '- `observations`: short rule-based statements about these numbers.\n\n' +
          'Send the browser\'s local `date` (and `month`, to look at another month) so "today" follows the user\'s time zone. ' +
          'A month before `date`\'s month is complete: both comparisons then cover whole months.',
        operationId: 'getDashboardInsights',
        parameters: [
          {
            name: 'month',
            in: 'query',
            required: false,
            description: 'The month to look at (YYYY-MM). Defaults to the month of `date`. Must not be after `date`.',
            schema: monthSchema,
          },
          {
            name: 'date',
            in: 'query',
            required: false,
            description:
              "The user's today (YYYY-MM-DD), so a month in progress is compared with the same days of the previous month. Defaults to the server's date.",
            schema: dateSchema,
          },
        ],
        responses: {
          200: {
            description: 'The insights',
            content: {
              'application/json': {
                schema: ref.schema('DashboardInsightsResponse'),
                examples: {
                  inProgress: {
                    summary: 'A month in progress (daily shortened)',
                    value: insightsExample,
                  },
                  emptyMonth: {
                    summary: 'A month with no expenses (daily shortened)',
                    value: emptyMonthExample,
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid `month` or `date`, or `month` is after `date`',
            content: {
              'application/json': {
                schema: ref.schema('Error'),
                examples: {
                  monthAfterDate: {
                    summary: '`month` is after `date`',
                    value: {
                      code: 'BAD_REQUEST',
                      message: 'Invalid query parameters',
                      details: { date: ['"date" must not be before "month"'] },
                    },
                  },
                  invalidDate: {
                    summary: '`date` is not a real date',
                    value: {
                      code: 'BAD_REQUEST',
                      message: 'Invalid query parameters',
                      details: { date: ['Date must be a valid date in YYYY-MM-DD format'] },
                    },
                  },
                  monthNotStarted: {
                    summary: '`date` left out and `month` is after the server\'s date',
                    value: {
                      code: 'BAD_REQUEST',
                      message: 'Invalid query parameters',
                      details: { month: ['"month" has not started yet'] },
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
  },
};
