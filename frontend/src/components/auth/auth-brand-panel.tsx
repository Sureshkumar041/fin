import type { CSSProperties, ReactNode } from 'react';
import { ClockIcon, InsightsIcon, UsersIcon, WalletIcon } from '@/components/icons';
import { ACCENT_CLASSES, type Accent } from '@/lib/category-color';
import { cn } from '@/lib/cn';

// The brand side of /login and /register. Desktop (lg+): the left half, with
// the logo, headline, three feature points and a decorative app preview,
// centred as one block. Below lg: a compact header above the form.
// Colours come from the --auth-panel tokens: the hero gradient with dark text
// in light mode, a slate panel with soft glows and light text in dark mode
// (AA at every point in both).

const FEATURES: { accent: Accent; icon: ReactNode; title: string; text: string }[] = [
  { accent: 'cyan', icon: <UsersIcon />, title: 'Split expenses', text: 'Equal, custom or by percentage.' },
  { accent: 'pink', icon: <ClockIcon />, title: 'Track who owes you', text: 'See every pending share at a glance.' },
  { accent: 'violet', icon: <InsightsIcon />, title: 'Clear insights', text: 'Month-on-month changes and top categories.' },
];

export function AuthBrandPanel() {
  return (
    <aside className="relative isolate overflow-hidden rounded-b-[2rem] bg-(--auth-panel-fill) bg-(image:--auth-panel) px-6 pt-8 pb-20 text-(--auth-panel-foreground) sm:px-10 lg:flex lg:min-h-dvh lg:w-1/2 lg:flex-col lg:justify-center lg:rounded-none lg:border-r lg:border-border lg:p-12 xl:p-16">
      {/* Decorative: a faint dot grid fading towards the bottom. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.1] [background-image:radial-gradient(var(--auth-panel-foreground)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]"
      />

      {/* One block, centred vertically (and horizontally on wide screens). */}
      <div className="w-full lg:mx-auto lg:max-w-lg 2xl:max-w-xl">
        <p className="flex items-center gap-2.5 font-semibold">
          <span aria-hidden className="flex size-9 items-center justify-center rounded-xl bg-(--auth-panel-logo) text-brand-fill shadow-sm ring-1 ring-(--auth-panel-foreground)/15">
            <WalletIcon className="size-5" />
          </span>
          Expense Tracker
        </p>

        <p className="mt-8 text-3xl leading-tight font-bold tracking-tight sm:text-4xl lg:mt-12 xl:text-5xl">Know where your money goes.</p>
        <p className="mt-4 hidden text-base font-medium lg:block xl:text-lg">
          Track your spending, split bills with friends and see what changed, month by month.
        </p>
        <ul className="mt-8 hidden flex-col gap-4 lg:flex">
          {FEATURES.map((f) => (
            <li key={f.title} className="flex items-center gap-3.5">
              <span
                aria-hidden
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl text-on-brand shadow-md ring-1 ring-(--auth-panel-foreground)/15 [&>svg]:size-5',
                  ACCENT_CLASSES[f.accent].gradient,
                )}
              >
                {f.icon}
              </span>
              <span>
                <span className="block text-sm font-bold">{f.title}</span>
                <span className="block text-sm">{f.text}</span>
              </span>
            </li>
          ))}
        </ul>

        <AppPreview />
      </div>
    </aside>
  );
}

// Static sample values: a picture of the app, not data. Hidden from screen readers.
const BARS: { accent: Accent; height: string }[] = [
  { accent: 'sky', height: '45%' },
  { accent: 'violet', height: '70%' },
  { accent: 'pink', height: '35%' },
  { accent: 'amber', height: '85%' },
  { accent: 'emerald', height: '55%' },
  { accent: 'lime', height: '100%' },
];

const floating = (delay: string): CSSProperties => ({ animationDelay: delay });

function AppPreview() {
  return (
    // Its own row below the features, in normal flow (the cards are positioned inside this
    // box only), so it can never cover text. Hidden on short screens rather than squeezed.
    <div
      aria-hidden
      data-auth-preview
      className="relative mt-12 hidden h-64 w-full max-w-md select-none lg:[@media(min-height:860px)]:block"
    >
      {/* Gentle float; the global prefers-reduced-motion rule turns it off. */}
      <style>{`@keyframes auth-float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -8px; } }`}</style>

      <div
        style={floating('0s')}
        data-auth-preview-card
        className="absolute top-8 left-2 w-60 -rotate-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl motion-safe:animate-[auth-float_7s_ease-in-out_infinite]"
      >
        <p className="text-xs text-muted-foreground">Spent this month</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">₹12,450.00</p>
        <p className="mt-2 inline-flex rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">▼ 8% less</p>
      </div>

      <div
        style={floating('-2.5s')}
        data-auth-preview-card
        className="absolute top-2 right-2 w-52 rotate-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl motion-safe:animate-[auth-float_8s_ease-in-out_infinite]"
      >
        <p className="text-xs text-muted-foreground">Last 6 months</p>
        <div className="mt-3 flex h-20 items-end gap-2">
          {BARS.map((b) => (
            <span key={b.accent} className={cn('flex-1 rounded-t-md', ACCENT_CLASSES[b.accent].mark)} style={{ height: b.height }} />
          ))}
        </div>
      </div>

      <div
        style={floating('-5s')}
        data-auth-preview-card
        className="absolute bottom-2 left-20 w-64 -rotate-1 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xl motion-safe:animate-[auth-float_9s_ease-in-out_infinite]"
      >
        <p className="text-xs text-muted-foreground">Top categories</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {(
            [
              ['Travel', 'sky'],
              ['Food', 'orange'],
              ['Groceries', 'lime'],
            ] as const
          ).map(([name, accent]) => (
            <span key={name} className={cn('inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-0.5 text-xs font-medium', ACCENT_CLASSES[accent].chip)}>
              <span className={cn('flex size-5 items-center justify-center rounded-full text-[10px] font-semibold text-on-brand', ACCENT_CLASSES[accent].gradient)}>
                {name[0]}
              </span>
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
