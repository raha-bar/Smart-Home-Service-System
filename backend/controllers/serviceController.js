// backend/controllers/serviceController.js
import Service from '../models/service.js';

// small helper to safely pick fields from req.body
function pick(obj, keys) {
  return keys.reduce((acc, k) => {
    if (Object.prototype.hasOwnProperty.call(obj, k)) acc[k] = obj[k];
    return acc;
  }, {});
}

/**
 * GET /api/services
 * (optionally ?includeInactive=1 to include inactive ones)
 */
export async function listServices(req, res) {
  try {
    const query = {};
    if (req.query.includeInactive !== '1') query.active = true;
    const services = await Service.find(query).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/services/:id
 */
export async function getService(req, res) {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * POST /api/services
 * (protected; admin/provider)
 * body: { name, description, price, category }
 */
export async function createService(req, res) {
  try {
    let { name, description, price, category } = req.body;
    if (!name || price === undefined || price === null) {
      return res
        .status(400)
        .json({ message: 'name and price are required' });
    }
    // ensure number
    if (typeof price === 'string') price = Number(price);

    const service = await Service.create({
      name,
      description,
      price,
      category,
      provider: req.user?._id || null, // set by auth middleware
      active: true
    });

    res.status(201).json(service);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * PUT /api/services/:id
 * body: any of { name, description, price, category, active }
 */
export async function updateService(req, res) {
  try {
    const updates = pick(req.body, [
      'name',
      'description',
      'price',
      'category',
      'active'
    ]);
    if (updates.price !== undefined && typeof updates.price === 'string') {
      updates.price = Number(updates.price);
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * DELETE /api/services/:id
 * (protected; admin)
 */
export async function removeService(req, res) {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/* ---- Alias exports so either route naming works ---- */
export {
  listServices as getServices,
  getService as getServiceById,
  removeService as deleteService
};
