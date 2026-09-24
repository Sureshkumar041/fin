import type { ReactNode } from 'react';
import { InboxIcon } from '@/components/icons';

type EmptyStateProps = {
  title: string;
  description?: string;
  /** Optional call to action, e.g. a button to add the first item. */
  action?: ReactNode;
  icon?: ReactNode;
};

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <InboxIcon />}
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
