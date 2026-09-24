import { ApiError } from './client';

export type FieldErrors = Record<string, string>;

/**
 * Turns any thrown error into something a form can display:
 * - fieldErrors: first message per field from the API's `details`
 * - message: a human-readable summary for an <Alert>
 */
export function toFormErrors(err: unknown): { fieldErrors: FieldErrors; message: string } {
  if (err instanceof ApiError) {
    const fieldErrors: FieldErrors = {};
    for (const [field, messages] of Object.entries(err.details ?? {})) {
      if (messages[0]) fieldErrors[field] = messages[0];
    }
    return { fieldErrors, message: err.message };
  }
  return { fieldErrors: {}, message: 'Something went wrong. Please try again.' };
}
