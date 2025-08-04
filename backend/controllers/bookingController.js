const Booking = require('../models/booking');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { userId, serviceId, providerId, scheduledTime, address, notes } = req.body;
    const booking = new Booking({ userId, serviceId, providerId, scheduledTime, address, notes });
    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get bookings by user
exports.getBookingsByUser = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.params.userId })
      .populate('serviceId')
      .populate('providerId', 'email');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get bookings by provider
exports.getBookingsByProvider = async (req, res) => {
  try {
    const bookings = await Booking.find({ providerId: req.params.providerId })
      .populate('serviceId')
      .populate('userId', 'email');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};