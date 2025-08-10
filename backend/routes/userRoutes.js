// backend/routes/userRoutes.js
import { Router } from 'express';
import { register, login, me } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);

export default router;
