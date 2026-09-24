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
import { ExpenseFiltersBar } from './expense-filters';
import { ExpenseForm } from './expense-form';
import { ExpenseList } from './expense-list';
import { useExpenseFilters } from './use-expense-filters';

type FormState = { mode: 'create' } | { mode: 'edit'; expense: Expense } | null;

export function ExpensesView() {
  const { filters, page, query, hasFilters, setFilter, setPage, clearFilters } = useExpenseFilters();
  const list = useApi(() => expensesApi.list(query), [query]);
  const categories = useApi(() => categoriesApi.list());

  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { notice, showNotice } = useNotice();

  const categoryList = categories.data ?? [];
  const expenses = list.data?.expenses ?? [];
  const pagination = list.data?.pagination;

  async function handleSave(input: CreateExpenseInput) {
    if (form?.mode === 'edit') {
      await expensesApi.update(form.expense.id, input);
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
