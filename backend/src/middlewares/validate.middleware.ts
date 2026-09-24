import type { RequestHandler } from 'express';
import { z } from 'zod';
import { HttpError } from '../utils/http-error';

// Turns a Zod error into a 400. Errors about the whole object (e.g. "provide at
// least one field") become the message; per-field errors go in details.
function validationError(message: string, error: z.ZodError) {
  const { formErrors, fieldErrors } = z.flattenError(error);
  return new HttpError(400, formErrors[0] ?? message, fieldErrors);
}

// Validates req.body against a Zod schema. On success, req.body is replaced
// with the parsed value (trimmed, lowercased, unknown fields stripped).
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      throw validationError('Validation failed', result.error);
    }
    req.body = result.data;
    next();
  };
}

// Validates URL params (e.g. that :id is a UUID) so bad input is a 400,
// not a database error.
export function validateParams(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      throw validationError('Invalid URL parameters', result.error);
    }
    next();
  };
}

// Validates req.query and replaces it with the parsed value (numbers coerced,
// defaults applied). Express 5 makes req.query a read-only getter, so it's
// redefined on this request instead of assigned.
export function validateQuery(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      throw validationError('Invalid query parameters', result.error);
    }
    Object.defineProperty(req, 'query', { value: result.data, writable: true });
    next();
  };
}
