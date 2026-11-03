import { Panel } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { InsightObservation } from '@/types';

// The backend's rule-based observations, as sent: same order, same messages.
// For spending, up is bad: the badge is red for "negative" and green for
// "positive", like the dashboard's ▲/▼. The message itself says "more",
// "less", "up" or "down", so nothing depends on the colour or the arrow.

const INCREASES: readonly string[] = ['SPENDING_INCREASED', 'CATEGORY_INCREASED'];
const DECREASES: readonly string[] = ['SPENDING_DECREASED', 'CATEGORY_DECREASED'];

// Anything unexpected (a code or tone added later) gets the neutral badge.
const toneClass = (tone: string) =>
  tone === 'negative'
    ? 'bg-danger-soft text-danger'
    : tone === 'positive'
      ? 'bg-success-soft text-success'
      : 'bg-muted text-muted-foreground';

function Badge({ observation }: { observation: InsightObservation }) {
  const arrow = INCREASES.includes(observation.code) ? '▲' : DECREASES.includes(observation.code) ? '▼' : null;
  return (
    <span
      aria-hidden
      className={cn('flex size-6 shrink-0 items-center justify-center rounded-full text-xs', toneClass(observation.tone))}
    >
      {arrow ?? <span className="size-1.5 rounded-full bg-current" />}
    </span>
  );
}

export function ObservationsPanel({ observations }: { observations: InsightObservation[] }) {
  if (observations.length === 0) return null;
  return (
    <Panel title="Highlights">
      <ul className="flex flex-col gap-3">
        {observations.map((o, i) => (
          <li key={`${i}-${o.code}`} className="flex items-start gap-3 text-sm text-foreground">
            <Badge observation={o} />
            <span className="pt-0.5">{o.message}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
