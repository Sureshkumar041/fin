'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  ButtonLink,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Notice,
  PageHeader,
  Panel,
  Skeleton,
} from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { useNotice } from '@/hooks/use-notice';
import { categoriesApi, dashboardApi, toFormErrors } from '@/lib/api';
import type { Category } from '@/types';
import { CategoryForm } from './category-form';
import { CategoryList } from './category-list';

type FormState = { mode: 'create' } | { mode: 'edit'; category: Category } | null;

export function CategoriesView() {
  const list = useApi(() => categoriesApi.list());
  // All-time totals per category: shows usage and warns before deleting a category in use.
  const usage = useApi(() => dashboardApi.categories());

  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { notice, showNotice } = useNotice();

  const categories = list.data ?? [];
  const totals = useMemo(
    () => (usage.data ? new Map(usage.data.categories.map((c) => [c.id, c])) : undefined),
    [usage.data],
  );
  const deleteCount = toDelete ? totals?.get(toDelete.id)?.expenseCount : undefined;
  const deleteBlocked = deleteCount !== undefined && deleteCount > 0;

  function refresh() {
    list.reload();
    usage.reload();
  }

  async function handleSave(name: string) {
    if (form?.mode === 'edit') {
      await categoriesApi.update(form.category.id, { name });
      showNotice(`Renamed to “${name}”.`);
    } else {
      await categoriesApi.create({ name });
      showNotice(`Category “${name}” added.`);
    }
    setForm(null);
    refresh();
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await categoriesApi.remove(toDelete.id);
      showNotice(`Category “${toDelete.name}” deleted.`);
      setToDelete(null);
      refresh();
    } catch (err) {
      // e.g. 409 "Category has expenses" if expenses were added meanwhile.
      setDeleteError(toFormErrors(err).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Organise your expenses into categories."
        actions={
          <Button onClick={() => setForm({ mode: 'create' })} disabled={list.loading}>
            Add category
          </Button>
        }
      />
      <Notice message={notice} />

      <Panel title="Your categories" description={list.data ? `${categories.length} total` : undefined}>
        {list.loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : list.error && !list.data ? (
          <ErrorState message={list.error.message} onRetry={list.reload} retrying={list.refreshing} />
        ) : categories.length === 0 ? (
          <EmptyState
            title="No categories yet"
            description="Categories group your expenses, e.g. Groceries, Rent or Travel."
            action={
              <Button size="sm" onClick={() => setForm({ mode: 'create' })}>
                Add your first category
              </Button>
            }
          />
        ) : (
          <div className={list.refreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <CategoryList
              categories={categories}
              totals={totals}
              onEdit={(category) => setForm({ mode: 'edit', category })}
              onDelete={(category) => {
                setDeleteError(null);
                setToDelete(category);
              }}
            />
          </div>
        )}
      </Panel>

      <Dialog
        open={form !== null}
        onClose={() => setForm(null)}
        title={form?.mode === 'edit' ? 'Rename category' : 'Add category'}
      >
        {form && (
          <CategoryForm
            category={form.mode === 'edit' ? form.category : undefined}
            existing={categories}
            onSubmit={handleSave}
            onCancel={() => setForm(null)}
          />
        )}
      </Dialog>

      {deleteBlocked && toDelete ? (
        // A category that still has expenses can't be deleted (the API would
        // refuse with 409), so explain why up front instead of offering the button.
        <Dialog open onClose={() => setToDelete(null)} title={`Can’t delete “${toDelete.name}”`}>
          <p className="text-sm text-muted-foreground">
            It’s used by {deleteCount} expense{deleteCount === 1 ? '' : 's'}. Move those expenses to
            another category or delete them first.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Close
            </Button>
            <ButtonLink href={`/expenses?categoryId=${toDelete.id}`}>View expenses</ButtonLink>
          </div>
        </Dialog>
      ) : (
        <ConfirmDialog
          open={toDelete !== null}
          title="Delete category?"
          confirmLabel="Delete category"
          loading={deleting}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
        >
          {toDelete && (
            <p>
              <span className="font-medium text-foreground">{toDelete.name}</span> will be permanently
              deleted.
            </p>
          )}
        </ConfirmDialog>
      )}
    </>
  );
}
