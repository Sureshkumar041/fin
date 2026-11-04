'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { MoonIcon, PlusIcon, SunIcon, TagIcon } from '@/components/icons';
import { Brand } from '@/components/layout/brand';
import { ThemeToggle, useTheme } from '@/components/theme';
import {
  Alert,
  Avatar,
  Badge,
  CategoryIcon,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  LoadingState,
  PageHeader,
  Panel,
  PasswordInput,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';

const tokens = [
  ['background', 'bg-background'],
  ['foreground', 'bg-foreground'],
  ['card', 'bg-card'],
  ['surface-2', 'bg-surface-2'],
  ['muted', 'bg-muted'],
  ['muted-foreground', 'bg-muted-foreground'],
  ['subtle', 'bg-subtle'],
  ['border', 'bg-border'],
  ['input', 'bg-input'],
  ['ring', 'bg-ring'],
  ['primary', 'bg-primary'],
  ['primary-soft', 'bg-primary-soft'],
  ['brand-fill', 'bg-brand-fill'],
  ['on-brand', 'bg-on-brand'],
  ['secondary', 'bg-secondary'],
  ['success', 'bg-success'],
  ['warning', 'bg-warning'],
  ['danger', 'bg-danger'],
  ['info', 'bg-info'],
] as const;

// Written out in full so Tailwind generates every class: [name, mark, text on soft].
const accents = [
  ['lime', 'bg-accent-lime', 'bg-accent-lime-soft text-accent-lime-fg'],
  ['cyan', 'bg-accent-cyan', 'bg-accent-cyan-soft text-accent-cyan-fg'],
  ['violet', 'bg-accent-violet', 'bg-accent-violet-soft text-accent-violet-fg'],
  ['pink', 'bg-accent-pink', 'bg-accent-pink-soft text-accent-pink-fg'],
  ['amber', 'bg-accent-amber', 'bg-accent-amber-soft text-accent-amber-fg'],
  ['emerald', 'bg-accent-emerald', 'bg-accent-emerald-soft text-accent-emerald-fg'],
  ['orange', 'bg-accent-orange', 'bg-accent-orange-soft text-accent-orange-fg'],
  ['sky', 'bg-accent-sky', 'bg-accent-sky-soft text-accent-sky-fg'],
  ['rose', 'bg-accent-rose', 'bg-accent-rose-soft text-accent-rose-fg'],
  ['indigo', 'bg-accent-indigo', 'bg-accent-indigo-soft text-accent-indigo-fg'],
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  );
}

export function DesignSystemShowcase() {
  const { resolvedTheme, setTheme } = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Brand />
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
            Switch to {resolvedTheme === 'dark' ? 'light' : 'dark'}
          </Button>
          <ThemeToggle />
        </div>
      </div>

      <PageHeader title="Design system" description="Tokens and components, shown in the current theme." />

      <div className="flex flex-col gap-10">
        <Section title="Colour tokens">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {tokens.map(([name, cls]) => (
              <div key={name} className="flex flex-col gap-1.5">
                <div className={`h-12 rounded-lg border border-border ${cls}`} />
                <code className="text-xs text-muted-foreground">{name}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Accent palette">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {accents.map(([name, mark, chip]) => (
              <div key={name} className="flex items-center gap-2">
                <span className={`size-8 shrink-0 rounded-full ${mark}`} />
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${chip}`}>{name}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg bg-brand-fill px-3 py-1.5 text-sm font-medium text-on-brand">Brand fill</span>
            <span className="rounded-full bg-info-soft px-2 py-0.5 text-xs font-medium text-info">Info</span>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-2">
            <Button><PlusIcon className="size-4" />Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="danger-ghost">Danger ghost</Button>
            <Button loading>Saving…</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">Small</Button>
            <Button size="icon" variant="secondary" aria-label="Tag"><TagIcon /></Button>
          </div>
        </Section>

        <Section title="Form controls">
          <Card className="grid gap-4 sm:grid-cols-2">
            <FormField label="Amount" htmlFor="ds-amount" hint="At most 2 decimals">
              <Input id="ds-amount" placeholder="0.00" inputMode="decimal" />
            </FormField>
            <FormField label="Category" htmlFor="ds-category">
              <Select id="ds-category" defaultValue="">
                <option value="">Choose a category…</option>
                <option>Groceries</option>
                <option>Rent</option>
              </Select>
            </FormField>
            <FormField label="Description" htmlFor="ds-error" error="Description must be at most 255 characters">
              <Input id="ds-error" invalid defaultValue="Too long" />
            </FormField>
            <FormField label="Disabled" htmlFor="ds-disabled">
              <Input id="ds-disabled" disabled defaultValue="Read only" />
            </FormField>
            <FormField label="Password" htmlFor="ds-password" hint="Show/hide button inside the input">
              <PasswordInput id="ds-password" placeholder="Enter your password" autoComplete="off" />
            </FormField>
          </Card>
        </Section>

        <Section title="Badges and alerts">
          <div className="flex flex-wrap gap-2">
            <Badge>Neutral</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Paid</Badge>
            <Badge variant="warning">Over budget</Badge>
            <Badge variant="danger">Overdue</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="cyan">Equal</Badge>
            <Badge variant="violet">Custom</Badge>
            <Badge variant="pink">Percentage</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {['Groceries', 'Rent', 'Travel', 'Dining out', 'Utilities'].map((name) => (
              <span key={name} className="flex items-center gap-2 text-sm">
                <CategoryIcon category={{ id: name, name }} size="sm" />
                {name}
              </span>
            ))}
            <Avatar name="Asha Rao" colorKey="contact-1" />
            <Avatar name="Vikram Iyer" colorKey="contact-2" />
          </div>
          <div className="rounded-2xl bg-(image:--gradient-hero) p-5 text-on-brand">
            <p className="text-sm font-medium">Hero gradient</p>
            <p className="text-3xl font-bold tracking-tight">₹36,431.00</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Alert variant="info">Heads up: this is an informational message.</Alert>
            <Alert variant="success">Expense added.</Alert>
            <Alert variant="warning">You&apos;ve used 90% of this month&apos;s budget.</Alert>
            <Alert variant="error">Invalid email or password.</Alert>
          </div>
        </Section>

        <Section title="Card, panel and table">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <p className="text-sm text-muted-foreground">Spent this month</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">₹36,431.00</p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-success">▼ 6% less</span> than Aug
              </p>
            </Card>
            <Panel title="Recent expenses" description="Panel = titled card" className="lg:col-span-2">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ['21 Sept', 'Weekly groceries', 'Groceries', '₹1,707.00'],
                    ['20 Sept', 'Movie tickets', 'Entertainment', '₹775.00'],
                    ['19 Sept', 'Pizza night', 'Dining out', '₹886.00'],
                  ].map(([d, desc, cat, amt]) => (
                    <TableRow key={desc}>
                      <TableCell className="text-muted-foreground">{d}</TableCell>
                      <TableCell>{desc}</TableCell>
                      <TableCell><Badge>{cat}</Badge></TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{amt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>
          </div>
        </Section>

        <Section title="Dropdown and dialogs">
          <div className="flex flex-wrap items-center gap-2">
            <Dropdown trigger="Options" variant="secondary" align="start">
              <DropdownLabel><span className="text-muted-foreground">Expense</span></DropdownLabel>
              <DropdownItem onSelect={() => {}}>Edit</DropdownItem>
              <DropdownItem onSelect={() => {}}>Duplicate</DropdownItem>
              <DropdownSeparator />
              <DropdownItem variant="danger" onSelect={() => setConfirmOpen(true)}>Delete</DropdownItem>
            </Dropdown>
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>Open dialog</Button>
            <Button variant="danger-ghost" onClick={() => setConfirmOpen(true)}>Open confirm</Button>
          </div>
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title="Add category" description="Dialogs trap focus and close on Escape.">
            <div className="flex flex-col gap-4">
              <FormField label="Name" htmlFor="ds-dialog-name"><Input id="ds-dialog-name" autoFocus /></FormField>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setDialogOpen(false)}>Save</Button>
              </div>
            </div>
          </Dialog>
          <ConfirmDialog
            open={confirmOpen}
            title="Delete expense?"
            confirmLabel="Delete expense"
            onConfirm={() => setConfirmOpen(false)}
            onCancel={() => setConfirmOpen(false)}
          >
            <p><span className="font-medium text-foreground">Weekly groceries</span> will be permanently deleted.</p>
          </ConfirmDialog>
        </Section>

        <Section title="Loading, empty and error states">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-0"><LoadingState label="Loading expenses…" /></Card>
            <Card className="p-0">
              <EmptyState title="No expenses yet" description="Add your first expense to get started." action={<Button size="sm">Add expense</Button>} />
            </Card>
            <Card className="p-0"><ErrorState message="Service temporarily unavailable." onRetry={() => {}} /></Card>
          </div>
          <Card className="flex flex-col gap-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </Card>
        </Section>
      </div>
    </div>
  );
}
