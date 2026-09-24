'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  ButtonLink,
  ConfirmDialog,
  Dialog,
  EmptyState,
  ErrorState,
  Notice,
  PageHeader,
  Pagination,
  Panel,
  Skeleton,
} from '@/components/ui';
import { useApi } from '@/hooks/use-api';
import { useNotice } from '@/hooks/use-notice';
import { categoriesApi, expensesApi, toFormErrors } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import type { CreateExpenseInput, Expense } from '@/types';
import { ExpenseDetails } from './expense-details';
import { ExpenseFiltersBar } from './expense-filters';
import { ExpenseForm } from './expense-form';
import { ExpenseList } from './expense-list';
import { saveExpenseEdit } from './save-expense';
import { useExpenseFilters } from './use-expense-filters';

type FormState = { mode: 'create' } | { mode: 'edit'; expense: Expense } | null;

export function ExpensesView() {
  const { filters, page, query, hasFilters, setFilter, setPage, clearFilters } = useExpenseFilters();
  const list = useApi(() => expensesApi.list(query), [query]);
  const categories = useApi(() => categoriesApi.list());

  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<Expense | null>(null);
  // Only the id: the expense itself always comes from the list data, so a
  // settlement updates the row and the open details from one source.
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { notice, showNotice } = useNotice();

  const categoryList = categories.data ?? [];
  const expenses = list.data?.expenses ?? [];
  const pagination = list.data?.pagination;
  const viewing = expenses.find((e) => e.id === viewingId) ?? null;

  // Puts an expense returned by the API (e.g. after a settlement) into the list.
  function replaceExpense(updated: Expense) {
    list.setData((data) => data && { ...data, expenses: data.expenses.map((e) => (e.id === updated.id ? updated : e)) });
  }

  async function handleSave(input: CreateExpenseInput) {
    if (form?.mode === 'edit') {
      let latest = form.expense;
      try {
        await saveExpenseEdit(form.expense, input, (saved) => (latest = saved));
      } catch (err) {
        // Part of the edit was saved: keep the form open (with the user's input)
        // but compare the next attempt against what is now saved, and refresh the list.
        if (latest !== form.expense) {
          setForm({ mode: 'edit', expense: latest });
          list.reload();
        }
        throw err;
      }
      showNotice('Expense updated.');
    } else {
      await expensesApi.create(input);
      showNotice('Expense added.');
    }
    setForm(null);
    // A new expense is usually the newest, so it appears at the top of page 1.
    if (form?.mode === 'create' && page !== 1) setPage(1);
    else list.reload();
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await expensesApi.remove(toDelete.id);
      setToDelete(null);
      showNotice('Expense deleted.');
      // Deleting the only row on the last page: step back a page.
      if (expenses.length === 1 && page > 1) setPage(page - 1);
      else list.reload();
    } catch (err) {
      setDeleteError(toFormErrors(err).message);
    } finally {
      setDeleting(false);
    }
  }

  const noCategories = categories.data !== undefined && categoryList.length === 0;

  return (
    <>
      <PageHeader
        title="Expenses"
        description="Add, filter and search your expenses."
        actions={
          <Button onClick={() => setForm({ mode: 'create' })} disabled={!categories.data || noCategories}>
            Add expense
          </Button>
        }
      />

      <Notice message={notice} />

      {noCategories && (
        <div className="mb-4">
          <Alert variant="info">
            You need a category before adding expenses.{' '}
            <ButtonLink href="/categories" variant="ghost" size="sm" className="ml-1 text-primary">
              Create one
            </ButtonLink>
          </Alert>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Panel title="Filters">
          <ExpenseFiltersBar
            filters={filters}
            categories={categoryList}
            hasFilters={hasFilters}
            onChange={setFilter}
            onClear={clearFilters}
          />
        </Panel>

        <Panel title="All expenses">
          {list.loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : list.error && !list.data ? (
            <ErrorState message={list.error.message} onRetry={list.reload} retrying={list.refreshing} />
          ) : (
            <div className="flex flex-col gap-4">
              {list.error && <Alert variant="error">{list.error.message}</Alert>}
              {expenses.length === 0 ? (
                hasFilters ? (
                  <EmptyState
                    title="No expenses match these filters"
                    description="Try a different category, date range or search."
                    action={
                      <Button variant="secondary" size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState
                    title="No expenses yet"
                    description="Add your first expense to start tracking your spending."
                    action={
                      !noCategories && (
                        <Button size="sm" onClick={() => setForm({ mode: 'create' })}>
                          Add expense
                        </Button>
                      )
                    }
                  />
                )
              ) : (
                <div className={list.refreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                  <ExpenseList
                    expenses={expenses}
                    onEdit={(expense) => setForm({ mode: 'edit', expense })}
                    onView={(expense) => setViewingId(expense.id)}
                    onDelete={(expense) => {
                      setDeleteError(null);
                      setToDelete(expense);
                    }}
                  />
                </div>
              )}
              {pagination && (
                <Pagination
                  pagination={pagination}
                  onPageChange={setPage}
                  disabled={list.refreshing}
                  itemLabel="expenses"
                />
              )}
            </div>
          )}
        </Panel>
      </div>

      <Dialog
        open={form !== null}
        onClose={() => setForm(null)}
        title={form?.mode === 'edit' ? 'Edit expense' : 'Add expense'}
      >
        {form && (
          <ExpenseForm
            categories={categoryList}
            expense={form.mode === 'edit' ? form.expense : undefined}
            onSubmit={handleSave}
            onCancel={() => setForm(null)}
          />
        )}
      </Dialog>

      <Dialog open={viewing !== null} onClose={() => setViewingId(null)} title="Expense details">
        {viewing && (
          <ExpenseDetails
            expense={viewing}
            onUpdated={replaceExpense}
            onClose={() => setViewingId(null)}
            onEdit={() => {
              setViewingId(null);
              setForm({ mode: 'edit', expense: viewing });
            }}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete expense?"
        confirmLabel="Delete expense"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      >
        {toDelete && (
          <p>
            <span className="font-medium text-foreground">
              {toDelete.description ?? toDelete.category.name}
            </span>{' '}
            ({formatMoney(toDelete.amount)} on {formatDate(toDelete.expenseDate)}) will be permanently
            deleted.
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
