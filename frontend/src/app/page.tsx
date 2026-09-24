import { redirect } from 'next/navigation';

// "/" has no page of its own.
export default function Home() {
  redirect('/dashboard');
}
