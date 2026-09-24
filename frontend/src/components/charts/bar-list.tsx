export type BarListItem = {
  id: string;
  label: string;
  value: number;
  /** Share of the total, 0-100. */
  percentage: number;
  /** De-emphasised bar, used for the "Other" bucket. */
  muted?: boolean;
};

type BarListProps = {
  items: BarListItem[];
  formatValue: (value: number) => string;
};

/**
 * Ranked horizontal bars with every value and share written out, so nothing
 * depends on colour or hover. Bar length is relative to the largest item.
 */
export function BarList({ items, formatValue }: BarListProps) {
  const max = Math.max(...items.map((i) => i.value), 0) || 1;

  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((item) => (
        <li key={item.id}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-foreground">{item.label}</span>
            <span className="shrink-0 tabular-nums text-foreground">
              {formatValue(item.value)}
              <span className="ml-2 inline-block w-11 text-right text-muted-foreground">
                {Math.round(item.percentage)}%
              </span>
            </span>
          </div>
          <div className="mt-1.5 h-2" aria-hidden>
            <div
              className="h-full rounded-r"
              style={{
                width: `${Math.max((item.value / max) * 100, 1)}%`,
                background: item.muted ? 'var(--chart-other)' : 'var(--chart-series)',
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
