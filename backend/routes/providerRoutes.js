// backend/routes/providerRoutes.js
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  listProviders,
  getProvider,
  getMyProfile,
  updateMyProfile,
  setVerified,
  adminList
} from '../controllers/providerController.js';

const router = Router();

/** Public */
router.get('/', listProviders);
router.get('/:id', protect, getProvider); // requires auth if unverified; otherwise public data is fine via list

/** Provider self */
router.get('/me/profile', protect, requireRole('provider'), getMyProfile);
router.put('/me/profile', protect, requireRole('provider'), updateMyProfile);

/** Admin */
router.get('/admin/list', protect, requireRole('admin'), adminList);
router.put('/:id/verify', protect, requireRole('admin'), setVerified);

export default router;
