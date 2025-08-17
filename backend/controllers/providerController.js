// backend/controllers/providerController.js
import ProviderProfile from '../models/providerProfile.js';
import User from '../models/user.js';

/** Guard helpers */
function ensureProviderRole(req, res) {
  if (!req.user || req.user.role !== 'provider') {
    res.status(403).json({ message: 'Providers only' });
    return false;
  }
  return true;
}
function ensureAdminRole(req, res) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Admins only' });
    return false;
  }
  return true;
}

/**
 * PUBLIC: GET /api/providers
 * List providers (verified by default)
 * Query:
 *   verified=0|1 (default 1)
 *   q=<text> (matches displayName/bio/skills/categories)
 *   category=<cat>
 *   area=<area>
 *   skill=<skill>
 */
export async function listProviders(req, res) {
  try {
    const { verified = '1', q, category, area, skill } = req.query || {};
    const query = {};
    if (verified !== '0') query.isVerified = true;
    if (category) query.categories = category;
    if (area) query.serviceAreas = area;
    if (skill) query.skills = skill;

    if (q) {
      query.$or = [
        { displayName: { $regex: q, $options: 'i' } },
        { bio:         { $regex: q, $options: 'i' } },
        { skills:      { $elemMatch: { $regex: q, $options: 'i' } } },
        { categories:  { $elemMatch: { $regex: q, $options: 'i' } } }
      ];
    }

    const list = await ProviderProfile.find(query)
      .sort({ isVerified: -1, ratingAvg: -1, updatedAt: -1 })
      .populate('user', 'name email role');

    res.json(list);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * PUBLIC: GET /api/providers/:id
 * Returns a provider profile.
 * If not verified, only the provider themselves or admin can view.
 */
export async function getProvider(req, res) {
  try {
    const prof = await ProviderProfile.findOne({ user: req.params.id })
      .populate('user', 'name email role');

    if (!prof) return res.status(404).json({ message: 'Provider not found' });

    const isSelf = req.user && String(req.user._id) === String(prof.user._id);
    const isAdmin = req.user && req.user.role === 'admin';
    if (!prof.isVerified && !isSelf && !isAdmin) {
      return res.status(403).json({ message: 'Provider not verified' });
    }

    res.json(prof);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * PROVIDER: GET /api/providers/me
 * Get or lazy-create own profile.
 */
export async function getMyProfile(req, res) {
  try {
    if (!ensureProviderRole(req, res)) return;
    let prof = await ProviderProfile.findOne({ user: req.user._id }).populate('user', 'name email role');
    if (!prof) {
      prof = await ProviderProfile.create({ user: req.user._id, displayName: req.user.name || 'Provider' });
      prof = await prof.populate('user', 'name email role');
    }
    res.json(prof);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * PROVIDER: PUT /api/providers/me
 * Update own profile (does NOT change verification flag).
 * Body accepts: displayName, phone, bio, skills[], categories[], serviceAreas[], hourlyRate, minFee
 */
export async function updateMyProfile(req, res) {
  try {
    if (!ensureProviderRole(req, res)) return;
    const allowed = [
      'displayName', 'phone', 'bio', 'skills', 'categories', 'serviceAreas', 'hourlyRate', 'minFee'
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const prof = await ProviderProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('user', 'name email role');

    res.json(prof);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * ADMIN: PUT /api/providers/:id/verify
 * Body: { verified: true|false }
 */
export async function setVerified(req, res) {
  try {
    if (!ensureAdminRole(req, res)) return;
    const { verified } = req.body || {};
    if (typeof verified !== 'boolean') {
      return res.status(400).json({ message: 'verified must be boolean' });
    }

    const prof = await ProviderProfile.findOneAndUpdate(
      { user: req.params.id },
      { $set: { isVerified: verified, verifiedAt: verified ? new Date() : null } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate('user', 'name email role');

    res.json(prof);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * ADMIN: GET /api/providers/admin/list
 * Query: verified=0|1|all, q, category, area, skill
 */
export async function adminList(req, res) {
  try {
    if (!ensureAdminRole(req, res)) return;
    const { verified = 'all', q, category, area, skill } = req.query || {};
    const query = {};
    if (verified === '1') query.isVerified = true;
    if (verified === '0') query.isVerified = false;
    if (category) query.categories = category;
    if (area) query.serviceAreas = area;
    if (skill) query.skills = skill;
    if (q) {
      query.$or = [
        { displayName: { $regex: q, $options: 'i' } },
        { bio:         { $regex: q, $options: 'i' } },
        { skills:      { $elemMatch: { $regex: q, $options: 'i' } } },
        { categories:  { $elemMatch: { $regex: q, $options: 'i' } } }
      ];
    }

    const list = await ProviderProfile.find(query)
      .sort({ isVerified: -1, updatedAt: -1 })
      .populate('user', 'name email role');

    res.json(list);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
