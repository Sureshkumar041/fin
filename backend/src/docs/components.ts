import type { OpenAPIV3_1 } from 'openapi-types';
import { AUTH_COOKIE } from '../utils/auth-cookie';
import { ref } from './types';

// Building blocks shared by every module. Feature-specific schemas live in
// that feature's docs file instead.
export const components: OpenAPIV3_1.ComponentsObject = {
  securitySchemes: {
    cookieAuth: {
      type: 'apiKey',
      in: 'cookie',
      name: AUTH_COOKIE,
      description:
        'JWT stored in an HTTP-only cookie. It is set by POST /api/auth/login or ' +
        'POST /api/auth/register and sent automatically by the browser. JavaScript ' +
        '(including Swagger UI) cannot read or set it: log in through the ' +
        'login endpoint on this page and later requests will include it.',
    },
  },

  schemas: {
    // Matches what errorHandler (middlewares/error.middleware.ts) sends.
    Error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: {
          type: 'string',
          description: 'Stable, machine-readable error code',
          enum: [
            'BAD_REQUEST',
            'UNAUTHENTICATED',
            'FORBIDDEN',
            'NOT_FOUND',
            'CONFLICT',
            'PAYLOAD_TOO_LARGE',
            'INTERNAL_ERROR',
            'SERVICE_UNAVAILABLE',
          ],
        },
        message: { type: 'string', description: 'Human-readable message' },
        details: {
          type: 'object',
          description: 'Validation errors per field (only on validation failures)',
          additionalProperties: { type: 'array', items: { type: 'string' } },
        },
      },
      example: { code: 'NOT_FOUND', message: 'Expense not found' },
    },
  },

  parameters: {
    IdParam: {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
      example: '3f1c2a4e-8b7d-4c6a-9e2f-1a2b3c4d5e6f',
    },
    // validators/common.validator.ts isoDate. "from" must be on or before "to".
    FromDateQuery: {
      name: 'from',
      in: 'query',
      required: false,
      description: 'Start date, inclusive (YYYY-MM-DD). Must be on or before `to`.',
      schema: { type: 'string', format: 'date' },
      example: '2026-09-01',
    },
    ToDateQuery: {
      name: 'to',
      in: 'query',
      required: false,
      description: 'End date, inclusive (YYYY-MM-DD).',
      schema: { type: 'string', format: 'date' },
      example: '2026-09-30',
    },
  },

  // Standard error responses, referenced as ref.response('Unauthorized') etc.
  responses: {
    BadRequest: {
      description: 'Invalid input',
      content: {
        'application/json': {
          schema: ref.schema('Error'),
          example: {
            code: 'BAD_REQUEST',
            message: 'Validation failed',
            details: { name: ['Name is required'] },
          },
        },
      },
    },
    Unauthorized: {
      description: 'Not logged in, or the session is invalid/expired',
      content: {
        'application/json': {
          schema: ref.schema('Error'),
          example: { code: 'UNAUTHENTICATED', message: 'Not authenticated' },
        },
      },
    },
    NotFound: {
      description: 'Resource not found (or it belongs to another user)',
      content: {
        'application/json': {
          schema: ref.schema('Error'),
          example: { code: 'NOT_FOUND', message: 'Not found' },
        },
      },
    },
    Conflict: {
      description: 'Conflicts with existing data',
      content: {
        'application/json': {
          schema: ref.schema('Error'),
          example: { code: 'CONFLICT', message: 'A category with this name already exists' },
        },
      },
    },
    InternalError: {
      description: 'Unexpected server error',
      content: {
        'application/json': {
          schema: ref.schema('Error'),
          example: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
        },
      },
    },
  },
};
