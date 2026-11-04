# Design system

Live reference: **http://localhost:3001/design-system** (every token and component, in the current theme).

## Where things live

| What | Where |
|---|---|
| Colour tokens (light + dark) | `src/app/globals.css` (`:root` = light, `.dark` = dark, `@theme inline` = Tailwind names) |
| Theme switching | `src/components/theme/` (provider, toggle, pre-paint script) |
| UI components | `src/components/ui/` (import from `@/components/ui`) |
| Icons | `src/components/icons/` (inline SVG, inherit text colour) |
| App layout | `src/components/layout/` (`AppShell`, sidebar nav, header, user menu) |
| Sidebar links | `src/components/layout/nav-items.ts` |

## Rules

1. **Never use raw colours** (`zinc-500`, `emerald-600`, `#fff`, `bg-white`). Use tokens:
   `bg-background` · `bg-card` · `bg-muted` · `text-foreground` · `text-muted-foreground` ·
   `border-border` · `border-input` · `bg-primary text-primary-foreground` · `bg-primary-soft text-primary` ·
   `text-success` / `bg-success-soft` · `text-warning` / `bg-warning-soft` · `text-danger` / `bg-danger-soft` ·
   `text-info` / `bg-info-soft` · `bg-surface-2` (inputs, raised areas) · `shadow-card` (light-only card shadow).
   - **Brand:** `text-primary` is the brand *text/icon* colour (links, active nav). Bright lime is a *fill* only:
     `bg-brand-fill text-on-brand` (always dark text on it). Never use bright lime as text on a light background.
   - **Accents** (categories, stats, badges): `bg-accent-{name}` for marks (bars, dots, icons on cards),
     `bg-accent-{name}-soft text-accent-{name}-fg` for chips and icon circles. Names: lime, cyan, violet, pink,
     amber, emerald, orange, sky, rose, indigo. Never use accents for good/bad meaning; that's success/danger.
   - `bg-subtle` / `--subtle` is **non-text only** (decoration, disabled), in both themes: it is ~3:1.
   - **Gradients** (tokens in `globals.css`): `bg-(image:--gradient-hero)` (dashboard hero, dark text),
     `--gradient-brand` (primary buttons), `--gradient-page` (page glows, decorative),
     `--gradient-{accent}` (avatars, category icons, stat chips; always dark text/icons on them).
     Text on a gradient must pass 4.5:1 at every point in both themes. Semantic colours stay solid.
   - **Stable colours:** `accentFor(id)` in `lib/category-color.ts`; `<CategoryIcon>` and `<Avatar>` use it.
   - **Motion:** 150–200 ms colour/shadow transitions; anything that moves uses `motion-safe:`.
     `prefers-reduced-motion` turns transitions and animations off globally.
2. **No `dark:` overrides for colours.** Tokens already switch; `dark:` is only for rare non-colour tweaks.
3. **Reach for a component first**: `Button`, `ButtonLink`, `Input`, `Select`, `FormField`, `Card`, `Panel`,
   `Badge`, `Table*`, `Dropdown*`, `Dialog`, `ConfirmDialog`, `Alert`, `Notice`, `Pagination`,
   `Skeleton`, `LoadingState`, `EmptyState`, `ErrorState`, `PageHeader`.
4. **Status colour never stands alone**: pair it with text or an icon ("▼ 6% less", "Overdue").
5. **New token?** Add it to `:root` *and* `.dark`, map it in `@theme inline`, check contrast
   (text ≥ 4.5:1, borders/focus ≥ 3:1) in both themes, and add a swatch to `/design-system`.

## A new page

```tsx
// src/app/(app)/budgets/page.tsx  (inside (app) = sidebar, header, login required)
import { PageHeader, Panel, EmptyState, Button } from '@/components/ui';

export default function BudgetsPage() {
  return (
    <>
      <PageHeader title="Budgets" description="Monthly limits per category." actions={<Button>Add budget</Button>} />
      <Panel title="This month">
        <EmptyState title="No budgets yet" />
      </Panel>
    </>
  );
}
```

Then add `{ href: '/budgets', label: 'Budgets', icon: ... }` to `nav-items.ts`.
