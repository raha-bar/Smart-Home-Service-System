// backend/routes/bookingRoutes.js
import { Router } from 'express';
import {
  createBooking,
  myBookings,
  updateStatus,
  updateBooking,
  assignProvider,
  adminListBookings,
  exportBookingsCsv,
  getBookingById,
  myAssignedBookings
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();

/* Customer self */
router.post('/', protect, createBooking);
router.get('/me', protect, myBookings);
router.patch('/:id', protect, updateBooking);

/* Provider self */
router.get('/provider/me', protect, requireRole('provider'), myAssignedBookings);

/* Admin lists + CSV export */
router.get('/', protect, requireRole('admin'), adminListBookings);
router.get('/export.csv', protect, requireRole('admin'), exportBookingsCsv);

/* Admin functions */
router.put('/:id/assign-provider', protect, requireRole('admin'), assignProvider);

/* Admin/Provider status updates */
router.put('/:id/status', protect, requireRole('admin', 'provider'), updateStatus);

/* Item detail (admin OR participant) */
router.get('/:id', protect, getBookingById);

export default router;
