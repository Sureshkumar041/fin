import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth';
import { Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Log in' };

export default function LoginPage() {
  return (
    <Card className="p-6 shadow-card-hover sm:p-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
      <p className="mt-2 mb-7 text-sm text-muted-foreground">Log in to see where your money went.</p>
      <LoginForm />
      {false && <p className="mt-6 text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>}
    </Card>
  );
}
