// backend/controllers/bookingController.js
import mongoose from 'mongoose';
import Booking from '../models/booking.js';
import { emitBookingEvent } from '../realtime/socket.js';

/* --------------------------------- Helpers -------------------------------- */

function ensureOwner(reqUserId, ownerId) {
  return String(reqUserId) === String(ownerId);
}

function isObjectId(v) {
  return mongoose.Types.ObjectId.isValid(String(v ?? ''));
}

function parseStatuses(input, allowed) {
  if (!input) return null;
  const parts = String(input)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const ok = parts.filter((s) => allowed.includes(s));
  return ok.length ? ok : null;
}

function buildDateRange(from, to) {
  const cond = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(+d)) cond.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(+d)) cond.$lte = d;
  }
  return Object.keys(cond).length ? cond : null;
}

/* ---------------------------- User-facing actions ------------------------- */

/**
 * POST /api/bookings
 * Body: { service, scheduledAt, address, notes, payment? }
 */
export const createBooking = async (req, res) => {
  try {
    const { service, scheduledAt, address, notes, payment } = req.body;

    if (!service || !scheduledAt || !address) {
      return res
        .status(400)
        .json({ message: 'service, scheduledAt and address are required' });
    }

    const booking = await Booking.create({
      user: req.user._id,
      service,
      scheduledAt,
      address,
      notes,
      payment: payment || { method: 'cash', status: 'unpaid' },
      status: 'pending',
    });

    emitBookingEvent('created', booking);
    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * GET /api/bookings/me
 * Returns bookings for current user (customer).
 */
export const myBookings = async (req, res) => {
  try {
    const list = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('service', 'name price category')
      .populate('provider', 'name');
    res.json(list);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * PATCH /api/bookings/:id
 * Users: reschedule OR (legacy) cancel — but cancel should use POST /:id/cancel
 * Body: { status?='cancelled', scheduledAt? }
 */
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, scheduledAt } = req.body || {};

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (!ensureOwner(req.user._id, booking.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (status !== undefined) {
      if (status !== 'cancelled') {
        return res
          .status(400)
          .json({ message: 'Users can only cancel; use /bookings/:id/cancel' });
      }
      booking.status = 'cancelled';
    }

    if (scheduledAt !== undefined) {
      if (['completed', 'cancelled'].includes(booking.status)) {
        return res
          .status(400)
          .json({ message: 'Cannot reschedule completed/cancelled booking' });
      }
      const d = new Date(scheduledAt);
      if (isNaN(+d))
        return res.status(400).json({ message: 'scheduledAt must be a valid date' });
      booking.scheduledAt = d;
    }

    await booking.save();
    emitBookingEvent('updated', booking);
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * POST /api/bookings/:id/cancel  (user)
 */
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    if (!ensureOwner(req.user._id, booking.user)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: 'Cannot cancel this booking' });
    }

    booking.status = 'cancelled';
    await booking.save();

    emitBookingEvent('cancelled', booking);
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ----------------------- Admin/Provider status updates -------------------- */

/**
 * PUT /api/bookings/:id/status  (admin or assigned provider)
 * Body: { status } where status ∈ ['pending','confirmed','on_the_way','completed','cancelled']
 */
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'on_the_way', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isAdmin = req.user?.role === 'admin';
    const isProvider = booking.provider && ensureOwner(req.user._id, booking.provider);
    if (!isAdmin && !isProvider) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    booking.status = status;
    await booking.save();

    emitBookingEvent('status', booking);
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * PUT /api/bookings/:id/assign-provider (admin)
 * Body: { provider }
 */
export const assignProvider = async (req, res) => {
  try {
    const { id } = req.params;
    const { provider } = req.body || {};
    if (!provider || !isObjectId(provider)) {
      return res.status(400).json({ message: 'Valid provider is required' });
    }

    // validate provider exists & is a provider
    const User = mongoose.model('User');
    const prov = await User.findById(provider);
    if (!prov || prov.role !== 'provider') {
      return res.status(400).json({ message: 'Provider not found or invalid role' });
    }

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.provider = provider;
    if (booking.status === 'pending') booking.status = 'confirmed';
    await booking.save();

    await booking.populate('service', 'name').populate('provider', 'name role');

    emitBookingEvent('assigned', booking);
    res.json(booking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ----------------------------- Admin listings ----------------------------- */

/**
 * GET /api/bookings  (admin)
 * Filters:
 *   ?status=pending,confirmed,completed,cancelled,on_the_way
 *   &user=<userId> &provider=<userId> &service=<serviceId>
 *   &q=<text in address>
 *   &from=<ISO> &to=<ISO> &dateField=scheduled|created (default scheduled)
 * Pagination & sort:
 *   &page=1&limit=10&sortBy=createdAt|scheduledAt|status&order=desc|asc
 */
export const adminListBookings = async (req, res) => {
  try {
    const {
      status,
      user,
      provider,
      service,
      q,
      from,
      to,
      dateField = 'scheduled',
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query || {};

    const allowedStatuses = ['pending', 'confirmed', 'on_the_way', 'completed', 'cancelled'];
    const statusList = parseStatuses(status, allowedStatuses);

    const filter = {};
    if (statusList) filter.status = { $in: statusList };
    if (user) {
      if (!isObjectId(user)) return res.status(400).json({ message: 'Invalid user id' });
      filter.user = user;
    }
    if (provider) {
      if (!isObjectId(provider))
        return res.status(400).json({ message: 'Invalid provider id' });
      filter.provider = provider;
    }
    if (service) {
      if (!isObjectId(service))
        return res.status(400).json({ message: 'Invalid service id' });
      filter.service = service;
    }
    if (q) {
      filter.address = { $regex: String(q), $options: 'i' };
    }

    const range = buildDateRange(from, to);
    const dateKey = dateField === 'created' ? 'createdAt' : 'scheduledAt';
    if (range) filter[dateKey] = range;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * lim;

    const sortDir = order === 'asc' ? 1 : -1;
    const sortField = ['createdAt', 'scheduledAt', 'status'].includes(sortBy)
      ? sortBy
      : 'createdAt';
    const sort = { [sortField]: sortDir, _id: -1 };

    const [items, total] = await Promise.all([
      Booking.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(lim)
        .populate('user', 'name email')
        .populate('provider', 'name email')
        .populate('service', 'name price category')
        .lean(),
      Booking.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      limit: lim,
      pages: Math.ceil(total / lim),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * GET /api/bookings/export.csv  (admin)
 * Same filters as adminListBookings; streams CSV.
 */
export const exportBookingsCsv = async (req, res) => {
  try {
    const {
      status,
      user,
      provider,
      service,
      q,
      from,
      to,
      dateField = 'scheduled',
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query || {};

    const allowedStatuses = ['pending', 'confirmed', 'on_the_way', 'completed', 'cancelled'];
    const statusList = parseStatuses(status, allowedStatuses);

    const filter = {};
    if (statusList) filter.status = { $in: statusList };
    if (user) {
      if (!isObjectId(user)) return res.status(400).json({ message: 'Invalid user id' });
      filter.user = user;
    }
    if (provider) {
      if (!isObjectId(provider))
        return res.status(400).json({ message: 'Invalid provider id' });
      filter.provider = provider;
    }
    if (service) {
      if (!isObjectId(service))
        return res.status(400).json({ message: 'Invalid service id' });
      filter.service = service;
    }
    if (q) filter.address = { $regex: String(q), $options: 'i' };

    const range = buildDateRange(from, to);
    const dateKey = dateField === 'created' ? 'createdAt' : 'scheduledAt';
    if (range) filter[dateKey] = range;

    const sortDir = order === 'asc' ? 1 : -1;
    const sortField = ['createdAt', 'scheduledAt', 'status'].includes(sortBy)
      ? sortBy
      : 'createdAt';
    const sort = { [sortField]: sortDir, _id: -1 };

    const cursor = Booking.find(filter)
      .sort(sort)
      .populate('user', 'name email')
      .populate('provider', 'name email')
      .populate('service', 'name price category')
      .cursor();

    const filename = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // header
    res.write(
      [
        'booking_id',
        'status',
        'scheduledAt',
        'createdAt',
        'user_name',
        'user_email',
        'provider_name',
        'provider_email',
        'service_name',
        'service_category',
        'service_price',
        'address',
      ].join(',') + '\n'
    );

    for await (const b of cursor) {
      const row = [
        b._id,
        b.status || '',
        b.scheduledAt ? new Date(b.scheduledAt).toISOString() : '',
        b.createdAt ? new Date(b.createdAt).toISOString() : '',
        b.user?.name || '',
        b.user?.email || '',
        b.provider?.name || '',
        b.provider?.email || '',
        b.service?.name || '',
        b.service?.category || '',
        (b.service?.price ?? '').toString(),
        (b.address || '').replace(/[\r\n]+/g, ' ').replace(/,/g, ';'),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
      res.write(row + '\n');
    }

    res.end();
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * GET /api/bookings/:id  (admin OR participant)
 */
export const getBookingById = async (req, res) => {
  try {
    const b = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('provider', 'name email')
      .populate('service', 'name price category');

    if (!b) return res.status(404).json({ message: 'Booking not found' });

    const isAdmin = req.user?.role === 'admin';
    const isCustomer = ensureOwner(req.user._id, b.user?._id || b.user);
    const isProvider =
      b.provider && ensureOwner(req.user._id, b.provider?._id || b.provider);
    if (!isAdmin && !isCustomer && !isProvider) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(b);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ---------------------------- Provider listings --------------------------- */

/**
 * GET /api/bookings/provider/me  (provider)
 * Filters: ?status=... , ?from=ISO &to=ISO (scheduledAt range), pagination
 */
export const myAssignedBookings = async (req, res) => {
  try {
    const {
      status,
      from,
      to,
      page = '1',
      limit = '10',
      sortBy = 'scheduledAt',
      order = 'asc',
    } = req.query || {};

    const allowedStatuses = ['pending', 'confirmed', 'on_the_way', 'completed', 'cancelled'];
    const statusList = parseStatuses(status, allowedStatuses);

    const filter = { provider: req.user._id };
    if (statusList) filter.status = { $in: statusList };

    const range = buildDateRange(from, to);
    if (range) filter.scheduledAt = range;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const lim = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * lim;

    const sortDir = order === 'desc' ? -1 : 1;
    const sortField = ['createdAt', 'scheduledAt', 'status'].includes(sortBy)
      ? sortBy
      : 'scheduledAt';
    const sort = { [sortField]: sortDir, _id: -1 };

    const [items, total] = await Promise.all([
      Booking.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(lim)
        .populate('user', 'name email')
        .populate('service', 'name price category')
        .lean(),
      Booking.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      limit: lim,
      pages: Math.ceil(total / lim),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
