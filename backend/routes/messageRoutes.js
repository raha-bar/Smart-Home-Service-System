// backend/routes/messageRoutes.js
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { listByBooking, sendMessage } from '../controllers/messageController.js';

const router = Router();

// chat endpoints
router.get('/:bookingId', protect, listByBooking);
router.post('/', protect, sendMessage);

export default router;
