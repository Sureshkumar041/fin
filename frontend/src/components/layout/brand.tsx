import Link from 'next/link';
import { WalletIcon } from '@/components/icons';

export function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 rounded-lg font-semibold text-foreground">
      <span className="flex size-8 items-center justify-center rounded-xl bg-brand-fill bg-(image:--gradient-lime) text-on-brand shadow-sm">
        <WalletIcon className="size-4.5" />
      </span>
      Expense Tracker
    </Link>
  );
}
