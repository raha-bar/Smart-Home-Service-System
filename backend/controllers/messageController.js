// backend/controllers/messageController.js
import Message from '../models/message.js';
import Booking from '../models/booking.js';

/**
 * Only the booking's user and its assigned provider can chat,
 * and only after the booking is at least 'confirmed'.
 */
function canChat(booking, userId) {
  const uid = String(userId);
  const isUser = String(booking.user) === uid;
  const isProvider = booking.provider && String(booking.provider) === uid;
  const allowedStatus = ['confirmed', 'on_the_way', 'completed'].includes(booking.status);
  return allowedStatus && (isUser || isProvider);
}

/**
 * GET /api/messages/:bookingId
 * List messages for a booking (visible to booking user or provider).
 */
export async function listByBooking(req, res) {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).select('user provider status');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (!canChat(booking, req.user._id)) {
      return res.status(403).json({ message: 'Not allowed to view messages for this booking' });
    }

    const msgs = await Message.find({ booking: bookingId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role')
      .populate('receiver', 'name role');

    res.json(msgs);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * POST /api/messages
 * Body: { booking, content, receiver }
 * Sender is derived from auth user; validates chat permissions.
 */
export async function sendMessage(req, res) {
  try {
    const { booking: bookingId, content, receiver } = req.body;
    if (!bookingId || !content || !receiver) {
      return res.status(400).json({ message: 'booking, content and receiver are required' });
    }

    const booking = await Booking.findById(bookingId).select('user provider status');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (!canChat(booking, req.user._id)) {
      return res.status(403).json({ message: 'Not allowed to send messages for this booking' });
    }

    // Only allow chatting with the other party in the booking
    const isReceiverValid =
      String(receiver) === String(booking.user) ||
      (booking.provider && String(receiver) === String(booking.provider));
    if (!isReceiverValid) {
      return res.status(400).json({ message: 'Receiver must be the other party in this booking' });
    }

    const msg = await Message.create({
      booking: bookingId,
      sender: req.user._id,
      receiver,
      content: String(content).trim()
    });

    const populated = await msg.populate([
      { path: 'sender', select: 'name role' },
      { path: 'receiver', select: 'name role' }
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
