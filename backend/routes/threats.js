import { Router } from 'express';
import { /*authenticate, authorize*/ } from '../middleware/auth.js';
import { listThreats, updateThreat } from '../controllers/threatsController.js';

const router = Router();

router.get('/', /* authenticate, authorize('admin'), */ listThreats);
router.patch('/:id', /* authenticate, authorize('admin'), */ updateThreat);

export default router;
