// backend/routes/bookingRoutes.js
import { Router } from 'express';
import {
  createBooking,
  myBookings,
  updateBooking,
  cancelBooking,
  updateStatus,
  assignProvider,
  adminListBookings,
  exportBookingsCsv,
  getBookingById,
  myAssignedBookings,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();

/* ---------------------------- User-facing routes --------------------------- */
// Create a new booking
router.post('/', protect, createBooking);

// Current user’s bookings
router.get('/me', protect, myBookings);

// Reschedule (and in legacy cases, user-initiated updates)
router.patch('/:id', protect, updateBooking);

// Cancel a booking (user)
router.post('/:id/cancel', protect, cancelBooking);

/* --------------------------- Provider-facing routes ------------------------ */
// Provider: list own assigned bookings
router.get('/provider/me', protect, requireRole('provider'), myAssignedBookings);

/* ----------------------------- Admin-facing routes ------------------------- */
// Admin: list bookings (with filters)
router.get('/', protect, requireRole('admin'), adminListBookings);

// Admin: export CSV (must be declared before /:id)
router.get('/export.csv', protect, requireRole('admin'), exportBookingsCsv);

// Admin: assign a provider
router.put('/:id/assign-provider', protect, requireRole('admin'), assignProvider);

// Admin/Provider: update status
router.put('/:id/status', protect, requireRole('admin', 'provider'), updateStatus);

/* -------------------------- Shared (admin or participant) ------------------ */
// Get booking by ID (declare last so it doesn’t shadow above routes)
router.get('/:id', protect, getBookingById);

export default router;
