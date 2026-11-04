import type { Metadata } from 'next';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth';
import { Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Create account' };

export default function RegisterPage() {
  return (
    <Card className="p-6 shadow-card-hover sm:p-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Create your account</h1>
      <p className="mt-2 mb-7 text-sm text-muted-foreground">Start tracking and splitting your expenses in a minute.</p>
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already registered?{' '}
        <Link href="/login" className="rounded-sm font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </Card>
  );
}
