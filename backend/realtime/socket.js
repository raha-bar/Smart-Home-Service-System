// backend/realtime/socket.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

export function initSocket(server) {
  const ORIGIN = process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  io = new Server(server, {
    cors: { origin: ORIGIN, credentials: true }
  });

  io.on('connection', (socket) => {
    // Read token from Socket.IO auth payload
    let userId = null;
    try {
      const token = socket.handshake?.auth?.token;
      if (token) {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret123');
        userId = String(payload.id || payload._id || payload.userId || '');
      }
    } catch (_) {
      // invalid token → continue as guest
    }

    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on('join:booking', (bookingId) => {
      if (bookingId) socket.join(`booking:${String(bookingId)}`);
    });

    socket.on('join:provider', (providerId) => {
      if (providerId) socket.join(`provider:${String(providerId)}`);
    });
  });

  return io;
}

function _io() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function emitBookingEvent(booking, type = 'updated') {
  if (!io || !booking) return;

  const payload = {
    type,
    bookingId: String(booking._id),
    status: booking.status,
    user: booking.user && String(booking.user._id || booking.user),
    provider: booking.provider && String(booking.provider._id || booking.provider),
    scheduledAt: booking.scheduledAt,
    updatedAt: booking.updatedAt,
  };

  _io().emit('bookings:event', payload); // global stream
  _io().to(`booking:${payload.bookingId}`).emit('booking:event', payload);
  if (payload.user) _io().to(`user:${payload.user}`).emit('booking:event', payload);
  if (payload.provider) _io().to(`provider:${payload.provider}`).emit('booking:event', payload);
}
