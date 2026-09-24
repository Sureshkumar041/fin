import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody, validateParams } from '../middlewares/validate.middleware';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';
import { idParamSchema } from '../validators/common.validator';

const router = Router();

// Every category route requires a logged-in user.
router.use(requireAuth);

router.post('/', validateBody(createCategorySchema), categoryController.create);
router.get('/', categoryController.list);
router.get('/:id', validateParams(idParamSchema), categoryController.getById);
router.patch(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateCategorySchema),
  categoryController.update,
);
router.delete('/:id', validateParams(idParamSchema), categoryController.remove);

export default router;
