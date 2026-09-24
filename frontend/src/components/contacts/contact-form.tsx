'use client';

import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Button, FormField, Input } from '@/components/ui';
import { ApiError, toFormErrors } from '@/lib/api';
import { validateContactName } from '@/lib/validation';
import type { Contact } from '@/types';

type ContactFormProps = {
  /** Pass a contact to edit it; omit to add one. */
  contact?: Contact;
  /** All loaded contacts, for the instant duplicate-name check. */
  existing: Contact[];
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
};

export function ContactForm({ contact, existing, onSubmit, onCancel }: ContactFormProps) {
  const [name, setName] = useState(contact?.name ?? '');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Guards against a second submit landing before the disabled state renders.
  const inFlight = useRef(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;
    const clientError = validateContactName(name, existing, contact?.id);
    setError(clientError);
    setFormError(null);
    if (clientError) return;

    inFlight.current = true;
    setSubmitting(true);
    try {
      await onSubmit(name.trim());
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(err.message); // duplicate name belongs under the field
      } else {
        const { fieldErrors, message } = toFormErrors(err);
        setError(fieldErrors.name);
        if (!fieldErrors.name) setFormError(message);
      }
      setSubmitting(false);
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError && <Alert variant="error">{formError}</Alert>}
      <FormField label="Name" htmlFor="contact-name" error={error} hint="Up to 100 characters">
        <Input
          id="contact-name"
          name="name"
          placeholder="e.g. Rahul"
          autoComplete="off"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(undefined);
          }}
          invalid={!!error}
          aria-describedby={error ? 'contact-name-error' : undefined}
          disabled={submitting}
          maxLength={100}
          autoFocus
        />
      </FormField>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {contact ? 'Save changes' : 'Add contact'}
        </Button>
      </div>
    </form>
  );
}
