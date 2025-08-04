const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Create booking
router.post('/', bookingController.createBooking);
// Get bookings by user
router.get('/user/:userId', bookingController.getBookingsByUser);
// Get bookings by provider
router.get('/provider/:providerId', bookingController.getBookingsByProvider);
// Update booking status
router.put('/:id/status', bookingController.updateBookingStatus);

module.exports = router;
