import Booking from '../models/booking.js';

export async function createBooking(req, res) {
  const { service, scheduledAt, address, notes } = req.body;
  const booking = await Booking.create({ service, scheduledAt, address, notes, user: req.user._id });
  res.status(201).json(booking);
}

export async function myBookings(req, res) {
  const bookings = await Booking.find({ user: req.user._id }).populate('service');
  res.json(bookings);
}

export async function updateStatus(req, res) {
  const { status } = req.body;
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  res.json(booking);
}