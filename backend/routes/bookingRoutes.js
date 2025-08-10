import { Router } from 'express';
import { createBooking, myBookings, updateStatus } from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();

router.post('/', protect, createBooking);
router.get('/me', protect, myBookings);
router.put('/:id/status', protect, requireRole('admin', 'provider'), updateStatus);

export default router;