import type { ApiDocsModule } from '../types';
import { errorResponse, ref } from '../types';

const exampleCategory = {
  id: '3f1c2a4e-8b7d-4c6a-9e2f-1a2b3c4d5e6f',
  name: 'Groceries',
  createdAt: '2026-09-23T10:03:36.757Z',
  updatedAt: '2026-09-23T10:03:36.757Z',
};

const categoryResponse = (description: string) => ({
  description,
  content: {
    'application/json': {
      schema: ref.schema('CategoryResponse'),
      example: { category: exampleCategory },
    },
  },
});

const invalidId = errorResponse('`id` is not a valid UUID', {
  code: 'BAD_REQUEST',
  message: 'Invalid URL parameters',
  details: { id: ['Invalid id'] },
});

const notFound = errorResponse("Category doesn't exist or belongs to another user", {
  code: 'NOT_FOUND',
  message: 'Category not found',
});

const invalidBody = errorResponse('Validation failed or body is not valid JSON', {
  code: 'BAD_REQUEST',
  message: 'Validation failed',
  details: { name: ['Name is required'] },
});

const duplicateName = errorResponse('Another category of this user has the same name (case-insensitive)', {
  code: 'CONFLICT',
  message: 'A category with this name already exists',
});

const body = {
  required: true,
  content: { 'application/json': { schema: ref.schema('CategoryInput') } },
};

export const categoryDocs: ApiDocsModule = {
  tag: {
    name: 'Categories',
    description: "The logged-in user's expense categories. Names are unique per user, ignoring case.",
  },

  schemas: {
    // services/category.service.ts CategoryResponse
    Category: {
      type: 'object',
      required: ['id', 'name', 'createdAt', 'updatedAt'],
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string', maxLength: 50 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
      example: exampleCategory,
    },
    CategoryResponse: {
      type: 'object',
      required: ['category'],
      properties: { category: ref.schema('Category') },
    },
    CategoryListResponse: {
      type: 'object',
      required: ['categories'],
      properties: { categories: { type: 'array', items: ref.schema('Category') } },
    },
    // validators/category.validator.ts: create and update use the same rules.
    CategoryInput: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 50, description: 'Trimmed before validation' },
      },
      example: { name: 'Groceries' },
    },
  },

  paths: {
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List categories',
        description: 'All categories of the logged-in user, sorted by name.',
        operationId: 'listCategories',
        responses: {
          200: {
            description: 'The categories',
            content: {
              'application/json': {
                schema: ref.schema('CategoryListResponse'),
                example: { categories: [exampleCategory] },
              },
            },
          },
          401: ref.response('Unauthorized'),
          500: ref.response('InternalError'),
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create a category',
        operationId: 'createCategory',
        requestBody: body,
        responses: {
          201: categoryResponse('Category created'),
          400: invalidBody,
          401: ref.response('Unauthorized'),
          409: duplicateName,
          500: ref.response('InternalError'),
        },
      },
    },

    '/categories/{id}': {
      parameters: [ref.parameter('IdParam')],
      get: {
        tags: ['Categories'],
        summary: 'Get a category',
        operationId: 'getCategory',
        responses: {
          200: categoryResponse('The category'),
          400: invalidId,
          401: ref.response('Unauthorized'),
          404: notFound,
          500: ref.response('InternalError'),
        },
      },
      patch: {
        tags: ['Categories'],
        summary: 'Rename a category',
        description: 'Renaming to a different casing of its own name is allowed.',
        operationId: 'updateCategory',
        requestBody: body,
        responses: {
          200: categoryResponse('Category updated'),
          400: errorResponse('Invalid `id`, validation failed, or body is not valid JSON', {
            code: 'BAD_REQUEST',
            message: 'Validation failed',
            details: { name: ['Name must be at most 50 characters'] },
          }),
          401: ref.response('Unauthorized'),
          404: notFound,
          409: duplicateName,
          500: ref.response('InternalError'),
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete a category',
        description: 'Only a category without expenses can be deleted.',
        operationId: 'deleteCategory',
        responses: {
          204: { description: 'Category deleted' },
          400: invalidId,
          401: ref.response('Unauthorized'),
          404: notFound,
          409: errorResponse('The category still has expenses', {
            code: 'CONFLICT',
            message: 'Category has expenses; move or delete them first',
          }),
          500: ref.response('InternalError'),
        },
      },
    },
  },
};
