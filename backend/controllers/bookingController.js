// backend/controllers/bookingController.js
import Booking from '../models/booking.js';

export const createBooking = async (req, res) => {
  try {
    const { service, scheduledAt, address, notes } = req.body;

    if (!service || !scheduledAt || !address) {
      return res.status(400).json({ message: 'service, scheduledAt and address are required' });
    }

    const booking = await Booking.create({
      service,
      scheduledAt,
      address,
      notes,
      user: req.user._id,
      status: 'pending'
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const myBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('service');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
