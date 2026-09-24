import type { ErrorRequestHandler, RequestHandler, Response } from 'express';
import { env } from '../config/env';
import { isDatabaseUnavailable, isForeignKeyViolation, isUniqueViolation } from '../utils/db-errors';
import { HttpError } from '../utils/http-error';

// Every error response has the same shape:
//   { "code": "NOT_FOUND", "message": "Expense not found", "details"?: {...} }
// "code" is stable for clients to branch on; "message" is for humans;
// "details" (field -> messages) only appears for validation errors.
const CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  500: 'INTERNAL_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

function sendError(res: Response, status: number, message: string, details?: unknown) {
  const hasDetails =
    details !== undefined && !(typeof details === 'object' && Object.keys(details ?? {}).length === 0);
  res.status(status).json({
    code: CODES[status] ?? 'ERROR',
    message,
    ...(hasDetails ? { details } : {}),
  });
}

// Unknown routes go through the error handler like every other error.
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Express 5 forwards errors thrown in (async) handlers here automatically.
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // 1. Errors we threw on purpose (validation, auth, not found, conflicts).
  if (err instanceof HttpError) {
    sendError(res, err.status, err.message, err.details);
    return;
  }

  // 2. Errors from express.json(). Don't echo the parser's internal message.
  if (err.type === 'entity.parse.failed') {
    sendError(res, 400, 'Request body is not valid JSON');
    return;
  }
  if (err.type === 'entity.too.large') {
    sendError(res, 413, 'Request body is too large');
    return;
  }

  // 3. Database errors a service didn't translate itself. Services map the
  //    expected cases to friendlier messages; these are the safety net.
  if (isUniqueViolation(err)) {
    sendError(res, 409, 'A record with these values already exists');
    return;
  }
  if (isForeignKeyViolation(err)) {
    sendError(res, 409, 'This record is referenced by other data');
    return;
  }
  if (isDatabaseUnavailable(err)) {
    console.error(`[503] ${req.method} ${req.originalUrl}: database unavailable`, err);
    sendError(res, 503, 'Service temporarily unavailable, please try again');
    return;
  }

  // 4. Anything else is a bug. Log it in full, but never send internals
  //    (SQL, stack traces) to the client in production.
  console.error(`[500] ${req.method} ${req.originalUrl}`, err);
  sendError(res, 500, env.isProduction ? 'Internal server error' : String(err?.message ?? err));
};
