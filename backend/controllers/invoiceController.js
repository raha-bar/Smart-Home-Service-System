// backend/controllers/invoiceController.js
import mongoose from 'mongoose';
import Invoice from '../models/invoice.js';
import Booking from '../models/booking.js';

/**
 * Create (or return existing) invoice for a booking.
 * POST /api/invoices/generate
 * Body: { bookingId, taxPct?, currency?, notes? }
 * Roles: admin, provider
 */
export async function generateInvoice(req, res) {
  try {
    const { bookingId, taxPct = 0, currency = 'USD', notes = '' } = req.body || {};
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    const booking = await Booking.findById(bookingId)
      .populate('service', 'price name')
      .populate('user', 'name')
      .populate('provider', 'name');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // idempotent: return existing invoice for this booking
    const existing = await Invoice.findOne({ booking: booking._id })
      .populate('service', 'name price')
      .populate('user', 'name')
      .populate('provider', 'name');
    if (existing) return res.json(existing);

    const price = Number(booking.service?.price || 0);
    const doc = await Invoice.create({
      booking: booking._id,
      user: booking.user,
      provider: booking.provider || undefined,
      service: booking.service?._id,
      currency,
      subtotal: price,
      taxPct: Number(taxPct) || 0,
      notes
    });

    const populated = await doc.populate([
      { path: 'service', select: 'name price' },
      { path: 'user', select: 'name' },
      { path: 'provider', select: 'name' }
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * GET /api/invoices/me  (customer's invoices)
 */
export async function myInvoices(req, res) {
  try {
    const list = await Invoice.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('service', 'name price')
      .populate('provider', 'name');
    res.json(list);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * GET /api/invoices/provider/me  (provider's invoices)
 * Role: provider
 */
export async function myProviderInvoices(req, res) {
  try {
    const list = await Invoice.find({ provider: req.user._id })
      .sort({ createdAt: -1 })
      .populate('service', 'name price')
      .populate('user', 'name');
    res.json(list);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * GET /api/invoices/:id
 * Access: admin OR (customer/provider on the invoice)
 */
export async function getInvoice(req, res) {
  try {
    const inv = await Invoice.findById(req.params.id)
      .populate('service', 'name price')
      .populate('user', 'name')
      .populate('provider', 'name');

    if (!inv) return res.status(404).json({ message: 'Invoice not found' });

    const isAdmin = req.user?.role === 'admin';
    const isCustomer = String(inv.user?._id || inv.user) === String(req.user._id);
    const isProvider = inv.provider && String(inv.provider?._id || inv.provider) === String(req.user._id);
    if (!isAdmin && !isCustomer && !isProvider) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(inv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * PUT /api/invoices/:id/pay
 * Roles: admin, provider
 * Body: { trxId? }
 * Marks invoice as paid and syncs Booking.payment fields.
 */
export async function markPaid(req, res) {
  try {
    const { id } = req.params;
    const { trxId } = req.body || {};

    const inv = await Invoice.findById(id);
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    if (inv.status === 'paid') return res.json(inv);

    inv.status = 'paid';
    inv.paidAt = new Date();
    if (trxId) inv.paymentTrxId = String(trxId);
    await inv.save();

    // sync booking payment state
    await Booking.findByIdAndUpdate(inv.booking, {
      $set: {
        'payment.status': 'paid',
        ...(trxId ? { 'payment.trxId': String(trxId) } : {})
      }
    });

    const populated = await Invoice.findById(inv._id)
      .populate('service', 'name price')
      .populate('user', 'name')
      .populate('provider', 'name');

    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * PUT /api/invoices/:id/void
 * Role: admin
 */
export async function voidInvoice(req, res) {
  try {
    const inv = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: 'void' },
      { new: true }
    );
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    res.json(inv);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * GET /api/invoices  (admin)
 * Optional query: ?status=paid|unpaid|void & ?user=<id> & ?provider=<id>
 */
export async function listAll(req, res) {
  try {
    const { status, user, provider } = req.query || {};
    const q = {};
    if (status) q.status = status;
    if (user) q.user = new mongoose.Types.ObjectId(user);
    if (provider) q.provider = new mongoose.Types.ObjectId(provider);

    const list = await Invoice.find(q)
      .sort({ createdAt: -1 })
      .populate('service', 'name price')
      .populate('user', 'name')
      .populate('provider', 'name');

    res.json(list);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
