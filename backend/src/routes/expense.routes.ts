import { Router } from 'express';
import { expenseController } from '../controllers/expense.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { idParamSchema } from '../validators/common.validator';
import {
  createExpenseSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from '../validators/expense.validator';
import { participantParamsSchema, settlementSchema, splitInputSchema } from '../validators/split.validator';

const router = Router();

// Every expense route requires a logged-in user.
router.use(requireAuth);

router.post('/', validateBody(createExpenseSchema), expenseController.create);
router.get('/', validateQuery(listExpensesQuerySchema), expenseController.list);
router.get('/:id', validateParams(idParamSchema), expenseController.getById);
router.patch(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateExpenseSchema),
  expenseController.update,
);
router.delete('/:id', validateParams(idParamSchema), expenseController.remove);

// Create or replace the split of an expense (the body is the split itself).
router.put(
  '/:id/split',
  validateParams(idParamSchema),
  validateBody(splitInputSchema),
  expenseController.replaceSplit,
);
// Turn a split expense back into a personal one (the expense itself stays).
router.delete('/:id/split', validateParams(idParamSchema), expenseController.removeSplit);
// Mark one participant PAID or PENDING.
router.patch(
  '/:id/split/participants/:participantId',
  validateParams(participantParamsSchema),
  validateBody(settlementSchema),
  expenseController.settleParticipant,
);

export default router;
