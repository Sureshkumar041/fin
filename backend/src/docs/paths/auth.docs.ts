import type { ApiDocsModule } from '../types';
import { errorResponse, ref } from '../types';

const exampleUser = {
  id: '9b2f6c1e-4a3d-4e8f-b1c2-7d6e5f4a3b2c',
  name: 'Suresh',
  email: 'suresh@example.com',
  createdAt: '2026-09-23T10:03:36.757Z',
};

const setCookieHeader = {
  'Set-Cookie': {
    description:
      'HTTP-only `access_token` cookie holding the JWT (SameSite=Lax, Path=/, Secure in production). ' +
      'Lifetime matches the JWT expiry (JWT_EXPIRES_IN_DAYS, default 7 days).',
    schema: { type: 'string' as const, example: 'access_token=eyJhbGciOi...; Path=/; HttpOnly; SameSite=Lax' },
  },
};

const userResponse = (description: string) => ({
  description,
  content: {
    'application/json': { schema: ref.schema('UserResponse'), example: { user: exampleUser } },
  },
});

export const authDocs: ApiDocsModule = {
  tag: {
    name: 'Auth',
    description:
      'Registration, login and session. A successful register/login sets the `access_token` cookie used by every protected endpoint.',
  },

  schemas: {
    // services/auth.service.ts PublicUser. Never includes the password hash.
    User: {
      type: 'object',
      required: ['id', 'name', 'email', 'createdAt'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', maxLength: 100 },
        email: { type: 'string', format: 'email', maxLength: 255 },
        createdAt: { type: 'string', format: 'date-time' },
      },
      example: exampleUser,
    },
    UserResponse: {
      type: 'object',
      required: ['user'],
      properties: { user: ref.schema('User') },
    },
    // validators/auth.validator.ts registerSchema
    RegisterRequest: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100, description: 'Trimmed before validation' },
        email: {
          type: 'string',
          format: 'email',
          maxLength: 255,
          description: 'Trimmed and lowercased before validation',
        },
        password: {
          type: 'string',
          format: 'password',
          minLength: 8,
          description: 'At least 8 characters and at most 72 bytes (UTF-8)',
        },
      },
      example: { name: 'Suresh', email: 'suresh@example.com', password: 'S3cure-pass' },
    },
    // validators/auth.validator.ts loginSchema
    LoginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          maxLength: 255,
          description: 'Trimmed and lowercased before validation',
        },
        password: { type: 'string', format: 'password', minLength: 1 },
      },
      example: { email: 'suresh@example.com', password: 'S3cure-pass' },
    },
  },

  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account and log in',
        description: 'Creates the user and sets the `access_token` cookie, so the new user is logged in straight away.',
        operationId: 'register',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: ref.schema('RegisterRequest') } },
        },
        responses: {
          201: { ...userResponse('Account created; auth cookie set'), headers: setCookieHeader },
          400: errorResponse('Validation failed or body is not valid JSON', {
            code: 'BAD_REQUEST',
            message: 'Validation failed',
            details: { password: ['Password must be at least 8 characters'] },
          }),
          409: errorResponse('Email is already registered', {
            code: 'CONFLICT',
            message: 'Email is already registered',
          }),
          500: ref.response('InternalError'),
        },
      },
    },

    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        description:
          'Checks the credentials and sets the `access_token` cookie. After this, "Try it out" on protected endpoints works from this page.',
        operationId: 'login',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: ref.schema('LoginRequest') } },
        },
        responses: {
          200: { ...userResponse('Logged in; auth cookie set'), headers: setCookieHeader },
          400: errorResponse('Validation failed or body is not valid JSON', {
            code: 'BAD_REQUEST',
            message: 'Validation failed',
            details: { email: ['Invalid email address'] },
          }),
          401: errorResponse('Wrong email or password (same message for both)', {
            code: 'UNAUTHENTICATED',
            message: 'Invalid email or password',
          }),
          500: ref.response('InternalError'),
        },
      },
    },

    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out',
        description:
          'Clears the `access_token` cookie. Does not require a valid session, and the JWT itself is not revoked server-side.',
        operationId: 'logout',
        security: [],
        responses: {
          204: {
            description: 'Cookie cleared',
            headers: {
              'Set-Cookie': {
                description: 'Expires the `access_token` cookie',
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },

    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the logged-in user',
        operationId: 'getCurrentUser',
        responses: {
          200: userResponse('The current user'),
          401: ref.response('Unauthorized'),
          500: ref.response('InternalError'),
        },
      },
    },
  },
};
