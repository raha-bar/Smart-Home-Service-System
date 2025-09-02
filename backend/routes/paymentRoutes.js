// backend/routes/paymentRoutes.js
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Booking from '../models/booking.js';
import Invoice from '../models/invoice.js';

const router = Router();

/**
 * POST /api/payments/charge
 * Body: { bookingId, method?: 'cash'|'online', trxId?: string }
 * Auth: logged-in user, assigned provider, or admin
 * Effect:
 *   - marks booking.payment { method, status:'paid', trxId? }
 *   - creates invoice if missing
 *   - marks invoice paid and returns { booking, invoice }
 */
router.post('/charge', protect, async (req, res) => {
  try {
    const { bookingId, method = 'online', trxId } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const booking = await Booking.findById(bookingId)
      .populate('service', 'price name')
      .populate('user', 'name')
      .populate('provider', 'name');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Authorization: owner, assigned provider, or admin
    const uid = String(req.user?._id || '');
    const role = String(req.user?.role || '');
    const isOwner = uid && String(booking.user?._id || booking.user) === uid;
    const isAssignedProvider = uid && booking.provider && String(booking.provider?._id || booking.provider) === uid;
    const isAdmin = role === 'admin';
    if (!(isOwner || isAssignedProvider || isAdmin)) {
      return res.status(403).json({ message: 'Not allowed to pay for this booking' });
    }

    // 1) Mark booking paid
    booking.payment = booking.payment || {};
    booking.payment.method = method;
    booking.payment.status = 'paid';
    if (trxId) booking.payment.trxId = String(trxId);
    await booking.save();

    // 2) Ensure invoice exists
    let invoice = await Invoice.findOne({ booking: booking._id });
    if (!invoice) {
      const price = Number(booking.service?.price || 0);
      invoice = await Invoice.create({
        booking: booking._id,
        user: booking.user,
        provider: booking.provider || undefined,
        service: booking.service?._id || booking.service,
        currency: 'USD',
        subtotal: price,
        taxPct: 0,
        notes: ''
      });
    }

    // 3) Mark invoice paid
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    if (trxId) invoice.paymentTrxId = String(trxId);
    await invoice.save();

    const populated = await Invoice.findById(invoice._id)
      .populate('service', 'name price')
      .populate('user', 'name')
      .populate('provider', 'name');

    return res.json({ booking, invoice: populated });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

export default router;
