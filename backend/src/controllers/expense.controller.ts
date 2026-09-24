import type { Request, Response } from 'express';
import { expenseService } from '../services/expense.service';
import type {
  CreateExpenseInput,
  ListExpensesQuery,
  UpdateExpenseInput,
} from '../validators/expense.validator';

// All routes use requireAuth, so req.user is always set here.
// Body, params and query have already been validated in the route.
export const expenseController = {
  async list(req: Request, res: Response) {
    const result = await expenseService.list(req.user!.id, req.query as unknown as ListExpensesQuery);
    res.json(result);
  },

  async getById(req: Request<{ id: string }>, res: Response) {
    const expense = await expenseService.getById(req.params.id, req.user!.id);
    res.json({ expense });
  },

  async create(req: Request, res: Response) {
    const expense = await expenseService.create(req.body as CreateExpenseInput, req.user!.id);
    res.status(201).json({ expense });
  },

  async update(req: Request<{ id: string }>, res: Response) {
    const expense = await expenseService.update(
      req.params.id,
      req.body as UpdateExpenseInput,
      req.user!.id,
    );
    res.json({ expense });
  },

  async remove(req: Request<{ id: string }>, res: Response) {
    await expenseService.remove(req.params.id, req.user!.id);
    res.status(204).end();
  },
};
