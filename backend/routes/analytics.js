import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { getOverview, getTrends } from '../controllers/analyticsController.js';

const router = Router();

router.get('/', authenticate, authorize('admin'), getOverview);
router.get('/trends', authenticate, authorize('admin'), getTrends);

export default router;
