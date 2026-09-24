'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Button, FormField, Input } from '@/components/ui';
import { ApiError, toFormErrors } from '@/lib/api';
import { validateCategoryName } from '@/lib/validation';
import type { Category } from '@/types';

type CategoryFormProps = {
  /** Pass a category to rename it; omit to create one. */
  category?: Category;
  /** All loaded categories, for the instant duplicate-name check. */
  existing: Category[];
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
};

export function CategoryForm({ category, existing, onSubmit, onCancel }: CategoryFormProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clientError = validateCategoryName(name, existing, category?.id);
    setError(clientError);
    setFormError(null);
    if (clientError) return;

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
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError && <Alert variant="error">{formError}</Alert>}
      <FormField label="Name" htmlFor="category-name" error={error} hint="Up to 50 characters">
        <Input
          id="category-name"
          name="name"
          placeholder="e.g. Groceries"
          autoComplete="off"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(undefined);
          }}
          invalid={!!error}
          disabled={submitting}
          maxLength={50}
          autoFocus
        />
      </FormField>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {category ? 'Save changes' : 'Add category'}
        </Button>
      </div>
    </form>
  );
}
