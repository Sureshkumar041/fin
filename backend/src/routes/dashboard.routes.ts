import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateQuery } from '../middlewares/validate.middleware';
import {
  categoriesQuerySchema,
  monthlyQuerySchema,
  summaryQuerySchema,
} from '../validators/dashboard.validator';

const router = Router();

// Every dashboard route requires a logged-in user.
router.use(requireAuth);

router.get('/summary', validateQuery(summaryQuerySchema), dashboardController.summary);
router.get('/monthly', validateQuery(monthlyQuerySchema), dashboardController.monthly);
router.get('/categories', validateQuery(categoriesQuerySchema), dashboardController.categories);

export default router;
