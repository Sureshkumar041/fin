'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Alert, Button, FormField, Input } from '@/components/ui';
import { ApiError, toFormErrors, type FieldErrors } from '@/lib/api';
import { validateRegister, type RegisterFormValues } from '@/lib/validation';
import { useAuth } from './auth-provider';

export function RegisterForm() {
  const { register } = useAuth();
  const [values, setValues] = useState<RegisterFormValues>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: '' }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clientErrors = validateRegister(values);
    setErrors(clientErrors);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      // confirmPassword is only checked here; it is never sent to the API.
      await register({ name: values.name, email: values.email, password: values.password });
      // Success: GuestOnly redirects to /dashboard.
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Duplicate email belongs next to the email field.
        setErrors({ email: err.message });
      } else {
        const { fieldErrors, message } = toFormErrors(err);
        setErrors(fieldErrors);
        setFormError(message);
      }
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError && <Alert variant="error">{formError}</Alert>}

      <FormField label="Name" htmlFor="name" error={errors.name}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={handleChange}
          invalid={!!errors.name}
          disabled={submitting}
          maxLength={100}
          required
        />
      </FormField>

      <FormField label="Email" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          invalid={!!errors.email}
          disabled={submitting}
          required
        />
      </FormField>

      <FormField
        label="Password"
        htmlFor="password"
        error={errors.password}
        hint="At least 8 characters"
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange}
          invalid={!!errors.password}
          disabled={submitting}
          required
        />
      </FormField>

      <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={handleChange}
          invalid={!!errors.confirmPassword}
          disabled={submitting}
          required
        />
      </FormField>

      <Button type="submit" loading={submitting} className="mt-2 w-full">
        {submitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
