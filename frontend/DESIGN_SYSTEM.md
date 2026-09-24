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
   `text-success` / `bg-success-soft` · `text-warning` / `bg-warning-soft` · `text-danger` / `bg-danger-soft`.
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
