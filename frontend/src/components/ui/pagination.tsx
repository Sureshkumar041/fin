import type { Pagination as PaginationInfo } from '@/types';
import { Button } from './button';

type PaginationProps = {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  /** Name of the items, e.g. "expenses". */
  itemLabel?: string;
};

export function Pagination({ pagination, onPageChange, disabled, itemLabel = 'items' }: PaginationProps) {
  const { page, limit, total, totalPages } = pagination;
  if (total === 0) return null;
  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{first}–{last}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span> {itemLabel}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={disabled || page <= 1}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {page} of {totalPages}
          </span>
          <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={disabled || page >= totalPages}>
            Next
          </Button>
        </div>
      )}
    </nav>
  );
}
