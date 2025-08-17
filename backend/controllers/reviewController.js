// backend/controllers/reviewController.js
import Review from '../models/review.js';
import Booking from '../models/booking.js';

/**
 * Helper: ensure user can review a service
 * - Must have at least one COMPLETED booking for that service
 */
async function userCanReviewService(userId, serviceId) {
  const exists = await Booking.exists({
    user: userId,
    service: serviceId,
    status: 'completed'
  });
  return !!exists;
}

/**
 * Helper: compute stats (approved reviews only)
 */
async function getServiceStats(serviceId) {
  const rows = await Review.aggregate([
    { $match: { service: new (await import('mongoose')).default.Types.ObjectId(serviceId), status: 'approved' } },
    { $group: { _id: '$service', count: { $sum: 1 }, avg: { $avg: '$rating' } } }
  ]);
  const row = rows[0];
  return {
    ratingCount: row?.count || 0,
    ratingAvg: row?.avg ? Number(row.avg.toFixed(2)) : 0
  };
}

/**
 * GET /api/reviews
 * Public: list approved reviews
 * Query: ?service=<serviceId> (optional, if omitted returns all approved reviews)
 * Admin: ?includeAll=1 to include pending/rejected
 */
export async function listReviews(req, res) {
  try {
    const { service, includeAll } = req.query || {};
    const query = {};
    if (service) query.service = service;

    if (includeAll === '1') {
      // Only admin can include all
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } else {
      query.status = 'approved';
    }

    const docs = await Review.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name')
      .populate('service', 'name');

    res.json(docs);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * GET /api/reviews/stats/:serviceId
 * Public: returns { ratingAvg, ratingCount } for approved reviews
 */
export async function getStats(req, res) {
  try {
    const stats = await getServiceStats(req.params.serviceId);
    res.json(stats);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * GET /api/reviews/me?service=<serviceId>
 * Get the current user's review for a service (any status)
 */
export async function getMyReview(req, res) {
  try {
    const { service } = req.query || {};
    if (!service) return res.status(400).json({ message: 'service is required' });

    const doc = await Review.findOne({ user: req.user._id, service })
      .populate('service', 'name');

    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * POST /api/reviews
 * Body: { service, rating, comment? }
 * Creates or replaces user's review for a service (upserts),
 * but only if the user had a completed booking for that service.
 * Sets status to 'pending' awaiting moderation.
 */
export async function createOrUpsertReview(req, res) {
  try {
    const { service, rating, comment } = req.body || {};
    if (!service || !rating) {
      return res.status(400).json({ message: 'service and rating are required' });
    }

    // Validate eligibility
    const eligible = await userCanReviewService(req.user._id, service);
    if (!eligible) {
      return res.status(400).json({ message: 'You can only review a service you completed' });
    }

    // Optionally attach one matching completed booking as provenance
    const booking = await Booking.findOne({
      user: req.user._id,
      service,
      status: 'completed'
    }).select('_id');

    // Upsert: if already exists, update content and reset to pending
    const doc = await Review.findOneAndUpdate(
      { user: req.user._id, service },
      {
        $set: {
          rating: Number(rating),
          comment: comment || '',
          status: 'pending',
          ...(booking ? { booking: booking._id } : {})
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(doc);
  } catch (err) {
    // handle unique index conflicts gracefully
    const msg = err?.code === 11000 ? 'You already reviewed this service' : err.message;
    res.status(400).json({ message: msg });
  }
}

/**
 * PATCH /api/reviews/:id
 * User can edit their own review; status resets to 'pending'.
 * Body: { rating?, comment? }
 */
export async function updateMyReview(req, res) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body || {};
    const doc = await Review.findById(id);
    if (!doc) return res.status(404).json({ message: 'Review not found' });

    if (String(doc.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (rating !== undefined) doc.rating = Number(rating);
    if (comment !== undefined) doc.comment = String(comment);
    // re-moderate after any user edit
    doc.status = 'pending';

    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * DELETE /api/reviews/:id
 * Owner or admin can delete
 */
export async function removeReview(req, res) {
  try {
    const { id } = req.params;
    const doc = await Review.findById(id);
    if (!doc) return res.status(404).json({ message: 'Review not found' });

    const isOwner = String(doc.user) === String(req.user._id);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    await doc.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * GET /api/reviews/moderation?status=pending
 * Admin list for moderation
 */
export async function listForModeration(req, res) {
  try {
    const { status = 'pending' } = req.query || {};
    const docs = await Review.find({ status })
      .sort({ createdAt: 1 })
      .populate('user', 'name')
      .populate('service', 'name');

    res.json(docs);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * PUT /api/reviews/:id/moderate
 * Admin approves or rejects a review
 * Body: { status: 'approved'|'rejected' }
 */
export async function moderateReview(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const doc = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: 'Review not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
