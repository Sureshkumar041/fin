import { QueryFailedError } from 'typeorm';

// PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
function pgCode(err: unknown): string | undefined {
  return err instanceof QueryFailedError
    ? (err.driverError as { code?: string })?.code
    : undefined;
}

export const isUniqueViolation = (err: unknown) => pgCode(err) === '23505';

// Deleting a row that other rows still reference. ON DELETE RESTRICT raises
// 23001; the default NO ACTION raises 23503.
export const isForeignKeyViolation = (err: unknown) => {
  const code = pgCode(err);
  return code === '23503' || code === '23001';
};

// The database can't be reached, or dropped the connection: network errors
// from the pg driver, SQLSTATE class 08 (connection exception) and 57P0x
// (server shutting down / not ready).
const NETWORK_ERROR_CODES = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'];

export const isDatabaseUnavailable = (err: unknown) => {
  const code =
    pgCode(err) ?? (err instanceof Error ? (err as { code?: string }).code : undefined);
  if (!code) return false;
  return NETWORK_ERROR_CODES.includes(code) || code.startsWith('08') || code.startsWith('57P0');
};
