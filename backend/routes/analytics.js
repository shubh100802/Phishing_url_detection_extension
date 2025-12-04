import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getOverview } from '../controllers/analyticsController.js';

const router = Router();

router.get('/', authenticate, authorize('admin'), getOverview);

export default router;
