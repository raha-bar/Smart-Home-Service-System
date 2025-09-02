// backend/routes/providerRoutes.js
import { Router } from 'express';
import ProviderProfile from '../models/providerProfile.js';
import User from '../models/user.js';
import { protect, maybeAuth } from '../middleware/authMiddleware.js';

const router = Router();

/* ------------ helpers ------------ */
function normalizeList(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

function buildQuery({ q, category, area, skill }) {
  const query = {};
  if (category) query.categories = category;
  if (area) query.serviceAreas = area;
  if (skill) query.skills = skill;
  if (q) {
    const re = { $regex: q, $options: 'i' };
    query.$or = [
      { displayName: re },
      { bio: re },
      { skills: { $elemMatch: re } },
      { categories: { $elemMatch: re } },
    ];
  }
  return query;
}

async function loadProviders(query) {
  return ProviderProfile.find(query)
    .sort({ isVerified: -1, ratingAvg: -1, updatedAt: -1 })
    .populate('user', 'name email role providerStatus');
}

/* ------------ lists ------------ */

// GET /api/providers  (public; admins can pass verified=all)
router.get('/', maybeAuth, async (req, res) => {
  try {
    const { verified = '1' } = req.query || {};
    const query = buildQuery(req.query);
    const isAdmin = req.user?.role === 'admin';

    if (verified === '0') query.isVerified = false;
    else if (!(isAdmin && verified === 'all')) query.isVerified = true;

    res.json(await loadProviders(query));
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to load providers' });
  }
});

// GET /api/providers/admin/list  (admin only)
router.get('/admin/list', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
    res.json(await loadProviders(buildQuery(req.query)));
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to load providers' });
  }
});

/* ------------ OPEN sign-up: create provider user + profile ------------ */
/**
 * PUBLIC
 * POST /api/providers/apply
 * Body:
 *   name|fullName (required), email (required), password (required),
 *   phone?, city?, bio?, skills?, categories?, serviceAreas?, experience|experienceYears?
 *
 * Behaviour:
 *   - If email already exists -> 409 (we do NOT change roles of existing users).
 *   - Else create User { role: 'provider', providerStatus: 'pending' } and ProviderProfile.
 */
router.post('/apply', async (req, res) => {
  try {
    const {
      name,
      fullName,
      email,
      password,
      phone,
      city,
      bio = '',
      skills = [],
      categories = [],
      serviceAreas = [],
      experience,
      experienceYears,
    } = req.body || {};

    const displayName = (fullName || name || '').trim();
    if (!displayName || !email || !password) {
      return res.status(400).json({ message: 'name/fullName, email and password are required' });
    }

    // Do not modify existing users
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists. Please log in with this email.' });
    }

    // 1) Create user (password hashed by User model pre-save)
    const user = await User.create({
      name: displayName,
      email,
      password,
      role: 'provider',
      providerStatus: 'pending',
    });

    // 2) Create provider profile
    const profile = await ProviderProfile.create({
      user: user._id,
      displayName,
      phone,
      city,
      bio,
      categories: normalizeList(categories),
      skills: normalizeList(skills),
      serviceAreas: normalizeList(serviceAreas),
      yearsExperience: Number(experienceYears ?? experience ?? 0) || 0,
      isVerified: false,
    });

    await profile.populate('user', 'name email role providerStatus');

    return res.status(201).json({
      ok: true,
      message: 'Provider account created. You can now log in.',
      user: { id: user._id, email: user.email, role: user.role, providerStatus: user.providerStatus },
      provider: profile,
    });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to create provider account' });
  }
});

/* ------------ verify toggle (admin) ------------ */

// PUT /api/providers/admin/:userId/verify  (admin only)
router.put('/admin/:userId/verify', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
    const { userId } = req.params;
    const verified = Boolean(req.body?.verified);

    const prof = await ProviderProfile.findOneAndUpdate(
      { user: userId },
      { $set: { isVerified: verified } },
      { new: true }
    ).populate('user', 'name email role providerStatus');

    if (!prof) return res.status(404).json({ message: 'Provider profile not found' });

    await User.findByIdAndUpdate(userId, {
      $set: { providerStatus: verified ? 'approved' : 'pending', role: 'provider' },
    });

    res.json({ ok: true, provider: prof });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to update verification' });
  }
});

// Legacy alias: PUT /api/providers/:userId/verify
router.put('/:userId/verify', protect, (req, res, next) => {
  req.url = `/admin/${req.params.userId}/verify`;
  next();
});

export default router;
