import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import type {
  CategoriesQuery,
  MonthlyQuery,
  SummaryQuery,
} from '../validators/dashboard.validator';

// All routes use requireAuth and validateQuery, so req.user and req.query are
// safe to use here.
export const dashboardController = {
  async summary(req: Request, res: Response) {
    const summary = await dashboardService.getSummary(
      req.user!.id,
      req.query as unknown as SummaryQuery,
    );
    res.json({ summary });
  },

  async monthly(req: Request, res: Response) {
    const monthly = await dashboardService.getMonthly(
      req.user!.id,
      req.query as unknown as MonthlyQuery,
    );
    res.json(monthly);
  },

  async categories(req: Request, res: Response) {
    const result = await dashboardService.getCategories(
      req.user!.id,
      req.query as unknown as CategoriesQuery,
    );
    res.json(result);
  },
};
