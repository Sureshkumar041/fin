// Stable accent colours for things that have no colour of their own
// (categories, contacts, the signed-in user). The same id always gets the
// same colour, on every page and after every reload. Categories have no
// colour field yet, so this is derived on the frontend from the id.

export const ACCENTS = ['lime', 'cyan', 'violet', 'pink', 'amber', 'emerald', 'orange', 'sky', 'rose', 'indigo'] as const;
export type Accent = (typeof ACCENTS)[number];

// FNV-1a: tiny, stable across browsers, and spreads similar UUIDs well.
function hash(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const accentFor = (key: string): Accent => ACCENTS[hash(key) % ACCENTS.length];

// Written out in full so Tailwind generates every class.
// mark: bars and dots · chip: soft tint with readable text · gradient: circle fill (dark text on it).
export const ACCENT_CLASSES: Record<Accent, { mark: string; chip: string; text: string; gradient: string }> = {
  lime: { mark: 'bg-accent-lime', chip: 'bg-accent-lime-soft text-accent-lime-fg', text: 'text-accent-lime-fg', gradient: 'bg-(image:--gradient-lime)' },
  cyan: { mark: 'bg-accent-cyan', chip: 'bg-accent-cyan-soft text-accent-cyan-fg', text: 'text-accent-cyan-fg', gradient: 'bg-(image:--gradient-cyan)' },
  violet: { mark: 'bg-accent-violet', chip: 'bg-accent-violet-soft text-accent-violet-fg', text: 'text-accent-violet-fg', gradient: 'bg-(image:--gradient-violet)' },
  pink: { mark: 'bg-accent-pink', chip: 'bg-accent-pink-soft text-accent-pink-fg', text: 'text-accent-pink-fg', gradient: 'bg-(image:--gradient-pink)' },
  amber: { mark: 'bg-accent-amber', chip: 'bg-accent-amber-soft text-accent-amber-fg', text: 'text-accent-amber-fg', gradient: 'bg-(image:--gradient-amber)' },
  emerald: { mark: 'bg-accent-emerald', chip: 'bg-accent-emerald-soft text-accent-emerald-fg', text: 'text-accent-emerald-fg', gradient: 'bg-(image:--gradient-emerald)' },
  orange: { mark: 'bg-accent-orange', chip: 'bg-accent-orange-soft text-accent-orange-fg', text: 'text-accent-orange-fg', gradient: 'bg-(image:--gradient-orange)' },
  sky: { mark: 'bg-accent-sky', chip: 'bg-accent-sky-soft text-accent-sky-fg', text: 'text-accent-sky-fg', gradient: 'bg-(image:--gradient-sky)' },
  rose: { mark: 'bg-accent-rose', chip: 'bg-accent-rose-soft text-accent-rose-fg', text: 'text-accent-rose-fg', gradient: 'bg-(image:--gradient-rose)' },
  indigo: { mark: 'bg-accent-indigo', chip: 'bg-accent-indigo-soft text-accent-indigo-fg', text: 'text-accent-indigo-fg', gradient: 'bg-(image:--gradient-indigo)' },
};

/** CSS colour of an accent's mark, for SVG fills and inline styles (charts). */
export const accentVar = (accent: Accent) => `var(--accent-${accent})`;
