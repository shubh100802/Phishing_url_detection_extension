import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { scanUrl } from '../controllers/scanController.js';

const router = Router();

router.post('/', authenticate, scanUrl);

export default router;
