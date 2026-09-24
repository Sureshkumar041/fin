import { Router } from 'express';
import { healthController } from '../controllers/health.controller';

// Route layer: maps URL + HTTP method to a controller function. No logic here.
const router = Router();

router.get('/', healthController.getHealth);

export default router;
