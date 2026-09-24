import { Alert } from './alert';

/** Announces success messages to screen readers and shows them as a green alert. */
export function Notice({ message }: { message: string | null }) {
  return (
    <div aria-live="polite" className="mb-4 empty:hidden">
      {message && <Alert variant="success">{message}</Alert>}
    </div>
  );
}
