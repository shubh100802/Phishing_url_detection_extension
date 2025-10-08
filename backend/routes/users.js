import { Router } from 'express';
import { /*authenticate, authorize*/ } from '../middleware/auth.js';
import { listUsers, createUser, updateUser } from '../controllers/usersController.js';

const router = Router();

router.get('/', /* authenticate, authorize('admin'), */ listUsers);
router.post('/', /* authenticate, authorize('admin'), */ createUser);
router.patch('/:id', /* authenticate, authorize('admin'), */ updateUser);

export default router;
