import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth';
import { Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <Card>
      <h1 className="mb-6 text-xl font-semibold text-foreground">Log in</h1>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </Card>
  );
}
