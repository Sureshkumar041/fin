import type { ReactNode } from 'react';

type FormFieldProps = {
  label: string;
  htmlFor: string;
  /** Shown in red under the input. Pass ApiError.details?.[field]?.[0] for server errors. */
  error?: string;
  hint?: string;
  children: ReactNode;
};

// Label + control + hint/error, laid out consistently in every form.
export function FormField({ label, htmlFor, error, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
