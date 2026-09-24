// Every error from the backend has this shape (see backend error.middleware.ts).
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
  /** Validation errors per field, e.g. { name: ['Name is required'] } */
  details?: Record<string, string[]>;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Dates as the API sends them. */
export type IsoDateTime = string; // "2026-09-23T11:04:05.751Z"
export type IsoDate = string; // "2026-09-23"
export type YearMonth = string; // "2026-09"
