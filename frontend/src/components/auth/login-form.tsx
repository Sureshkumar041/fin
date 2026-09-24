'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Alert, Button, FormField, Input, PasswordInput } from '@/components/ui';
import { toFormErrors, type FieldErrors } from '@/lib/api';
import { validateLogin } from '@/lib/validation';
import type { LoginInput } from '@/types';
import { useAuth } from './auth-provider';

export function LoginForm() {
  const { login } = useAuth();
  const [values, setValues] = useState<LoginInput>({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((errs) => ({ ...errs, [name]: '' })); // clear the field's error while typing
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clientErrors = validateLogin(values);
    setErrors(clientErrors);
    setFormError(null);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login(values);
      // Success: GuestOnly sees the new status and redirects. Keep the
      // button in its loading state until the page changes.
    } catch (err) {
      const { fieldErrors, message } = toFormErrors(err);
      setErrors(fieldErrors);
      setFormError(message); // e.g. "Invalid email or password"
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError && <Alert variant="error">{formError}</Alert>}

      <FormField label="Email" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={handleChange}
          invalid={!!errors.email}
          disabled={submitting}
          required
        />
      </FormField>

      <FormField label="Password" htmlFor="password" error={errors.password}>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={values.password}
          onChange={handleChange}
          invalid={!!errors.password}
          disabled={submitting}
          required
        />
      </FormField>

      <Button type="submit" loading={submitting} className="mt-2 w-full">
        {submitting ? 'Logging in…' : 'Log in'}
      </Button>
    </form>
  );
}
