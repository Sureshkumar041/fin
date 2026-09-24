import { Router } from 'express';
import { contactController } from '../controllers/contact.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody, validateParams } from '../middlewares/validate.middleware';
import { idParamSchema } from '../validators/common.validator';
import { createContactSchema, updateContactSchema } from '../validators/contact.validator';

const router = Router();

// Every contact route requires a logged-in user.
router.use(requireAuth);

router.post('/', validateBody(createContactSchema), contactController.create);
router.get('/', contactController.list);
router.patch(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateContactSchema),
  contactController.update,
);
router.delete('/:id', validateParams(idParamSchema), contactController.remove);

export default router;
