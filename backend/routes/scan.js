import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  scanUrl,
  publicScanUrl,
  getScanHistory,
  getUserScanStats,
} from '../controllers/scanController.js';

const router = Router();

router.post('/', authenticate, scanUrl);
router.post('/public', publicScanUrl);
router.get('/history', authenticate, getScanHistory);
router.get('/stats', authenticate, getUserScanStats);

export default router;
