// backend/realtime/socket.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || '*', credentials: true }
  });

  io.on('connection', (socket) => {
    // client should send { token } once connected
    socket.on('auth', ({ token } = {}) => {
      try {
        if (!token) throw new Error('Missing token');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.data.user = { id: decoded.id, role: decoded.role };
        socket.join(`user:${decoded.id}`);
        if (decoded.role === 'provider') socket.join(`provider:${decoded.id}`);
        socket.emit('auth:ok', { userId: decoded.id, role: decoded.role });
      } catch (e) {
        socket.emit('auth:error', { message: e.message || 'Invalid token' });
      }
    });

    // optional: subscribe to a specific booking room
    socket.on('booking:subscribe', (bookingId) => {
      if (!bookingId) return;
      socket.join(`booking:${bookingId}`);
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

function safeIO() {
  if (!io) return null;
  return io;
}

/**
 * Emit booking update events to relevant rooms:
 * - booking:<id>
 * - user:<customerId>
 * - provider:<providerId> (if present)
 * Also a broadcast to namespace 'bookings' (all listeners).
 */
export function emitBookingEvent(type, booking) {
  const _io = safeIO();
  if (!_io || !booking) return;

  const payload = {
    type,
    bookingId: String(booking._id),
    status: booking.status,
    user: booking.user && String(booking.user._id || booking.user),
    provider: booking.provider && String(booking.provider._id || booking.provider),
    scheduledAt: booking.scheduledAt,
    updatedAt: booking.updatedAt,
  };

  _io.emit('bookings:event', payload); // global (optional)
  _io.to(`booking:${payload.bookingId}`).emit('booking:event', payload);
  if (payload.user) _io.to(`user:${payload.user}`).emit('booking:event', payload);
  if (payload.provider) _io.to(`provider:${payload.provider}`).emit('booking:event', payload);
}
