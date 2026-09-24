import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

// Thin wrappers that give every table the same spacing, borders and colours.
//   <Table>
//     <TableHeader><TableRow><TableHead>Date</TableHead></TableRow></TableHeader>
//     <TableBody><TableRow><TableCell>23 Sep</TableCell></TableRow></TableBody>
//   </Table>

export function Table({ className, containerClassName, ...props }: ComponentProps<'table'> & { containerClassName?: string }) {
  return (
    // Wide tables scroll inside their container instead of widening the page.
    <div className={cn('w-full overflow-x-auto', containerClassName)}>
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  );
}

export const TableHeader = ({ className, ...props }: ComponentProps<'thead'>) => (
  <thead className={cn('border-b border-border', className)} {...props} />
);

export const TableBody = ({ className, ...props }: ComponentProps<'tbody'>) => (
  <tbody className={cn('[&>tr:last-child]:border-0', className)} {...props} />
);

export const TableRow = ({ className, ...props }: ComponentProps<'tr'>) => (
  <tr className={cn('border-b border-border transition-colors hover:bg-muted/60', className)} {...props} />
);

export const TableHead = ({ className, ...props }: ComponentProps<'th'>) => (
  <th className={cn('h-10 px-3 text-left align-middle text-xs font-medium tracking-wide text-muted-foreground uppercase first:pl-0 last:pr-0', className)} {...props} />
);

export const TableCell = ({ className, ...props }: ComponentProps<'td'>) => (
  <td className={cn('px-3 py-3 align-middle first:pl-0 last:pr-0', className)} {...props} />
);
