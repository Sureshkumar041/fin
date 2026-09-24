import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth';
import { Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Create account' };

export default function RegisterPage() {
  return (
    <Card>
      <h1 className="mb-6 text-xl font-semibold text-foreground">Create account</h1>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </Card>
  );
}
