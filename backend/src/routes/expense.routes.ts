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

export default router;
