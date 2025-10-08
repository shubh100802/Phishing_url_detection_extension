import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { scanUrl } from '../controllers/scanController.js';

const router = Router();

// For now you can remove `authenticate` to allow testing without a token
router.post('/', /* authenticate, */ scanUrl);

export default router;
