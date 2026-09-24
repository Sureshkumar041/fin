import { ApiError, expensesApi } from '@/lib/api';
import { sameSplit, splitInputOf, toPaise } from '@/lib/split';
import type { CreateExpenseInput, Expense, UpdateExpenseInput } from '@/types';

/** Only the expense fields that differ from the saved expense. */
function changedFields(expense: Expense, fields: Omit<CreateExpenseInput, 'split'>): UpdateExpenseInput {
  const changes: UpdateExpenseInput = {};
  if (toPaise(fields.amount) !== toPaise(expense.amount)) changes.amount = fields.amount;
  if (fields.categoryId !== expense.category.id) changes.categoryId = fields.categoryId;
  if (fields.expenseDate !== expense.expenseDate) changes.expenseDate = fields.expenseDate;
  // The form sends "" for no description; the API stores and returns null.
  if ((fields.description ?? '') !== (expense.description ?? '')) changes.description = fields.description;
  return changes;
}

/**
 * Saves the edit form. PATCH /expenses/:id changes the expense fields; the
 * split itself only changes through PUT / DELETE /expenses/:id/split. Each is
 * called only when something it handles actually changed.
 *
 * The backend always checks a split against the expense's current amount, so
 * when both change, the order keeps them compatible: a split is removed or
 * shrunk before the amount goes down, and the amount goes up before a new
 * split needs the room.
 *
 * `onSaved` gets the latest expense after each successful call, so a failure
 * part-way (e.g. a 409 because someone has paid) still leaves the caller
 * with what was saved. The backend's error is rethrown unchanged, apart from
 * noting that earlier changes were saved.
 */
export async function saveExpenseEdit(
  expense: Expense,
  input: CreateExpenseInput,
  onSaved?: (latest: Expense) => void,
): Promise<Expense> {
  const { split, ...fields } = input;
  const changes = changedFields(expense, fields);

  type Step = () => Promise<Expense>;
  const patch: Step | null =
    Object.keys(changes).length > 0 ? () => expensesApi.update(expense.id, changes) : null;

  let splitStep: Step | null = null;
  let removingSplit = false;
  if (split) {
    const unchanged = expense.split !== null && sameSplit(splitInputOf(expense.split), split);
    if (!unchanged) splitStep = () => expensesApi.replaceSplit(expense.id, split);
  } else if (expense.split) {
    splitStep = () => expensesApi.removeSplit(expense.id);
    removingSplit = true;
  }

  const amountGoesDown = changes.amount !== undefined && toPaise(changes.amount) < toPaise(expense.amount);
  const steps = [patch, splitStep].filter((s): s is Step => s !== null);
  if (patch && splitStep && (removingSplit || amountGoesDown)) steps.reverse();

  let latest = expense;
  for (const [i, step] of steps.entries()) {
    try {
      latest = await step();
      onSaved?.(latest);
    } catch (err) {
      if (i > 0 && err instanceof ApiError) {
        throw new ApiError(err.status, err.code, `Some changes were saved, but not all: ${err.message}`, err.details);
      }
      throw err;
    }
  }
  return latest;
}
