import Service from '../models/service.js';

export async function listServices(_req, res) {
  const services = await Service.find({ active: true }).sort({ createdAt: -1 });
  res.json(services);
}

export async function getService(req, res) {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json(service);
}

export async function createService(req, res) {
  const { name, description, price, category } = req.body;
  const service = await Service.create({ name, description, price, category, provider: req.user._id });
  res.status(201).json(service);
}

export async function updateService(req, res) {
  const updates = (({ name, description, price, category, active }) => ({ name, description, price, category, active }))(req.body);
  const service = await Service.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json(service);
}

export async function removeService(req, res) {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) return res.status(404).json({ message: 'Service not found' });
  res.json({ ok: true });
}