import { Router } from 'express';
import ProviderApplication from '../models/providerApplication.js';
import User from '../models/user.js';
// add your admin auth middleware if you have one
// import adminOnly from '../middleware/adminOnly.js';

const router = Router();

// List applications (pending)
router.get('/applications', /*adminOnly,*/ async (req, res) => {
  const apps = await ProviderApplication.find().populate('user', 'name email providerStatus role').sort({ createdAt: -1 });
  res.json(apps);
});

// Approve
router.patch('/applications/:id/approve', /*adminOnly,*/ async (req, res) => {
  const app = await ProviderApplication.findById(req.params.id);
  if (!app) return res.status(404).send('Application not found');
  app.status = 'approved';
  await app.save();

  const user = await User.findById(app.user);
  if (user) {
    user.role = 'provider';
    user.providerStatus = 'approved';
    await user.save();
  }
  res.json({ ok: true });
});

// Reject
router.patch('/applications/:id/reject', /*adminOnly,*/ async (req, res) => {
  const app = await ProviderApplication.findById(req.params.id);
  if (!app) return res.status(404).send('Application not found');
  app.status = 'rejected';
  await app.save();

  const user = await User.findById(app.user);
  if (user) {
    user.providerStatus = 'rejected';
    await user.save();
  }
  res.json({ ok: true });
});

export default router;
