// backend/routes/reviewRoutes.js
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  listReviews,
  getStats,
  getMyReview,
  createOrUpsertReview,
  updateMyReview,
  removeReview,
  listForModeration,
  moderateReview
} from '../controllers/reviewController.js';

const router = Router();

// Public
router.get('/', listReviews);
router.get('/stats/:serviceId', getStats);

// Authenticated (user)
router.get('/me', protect, getMyReview);
router.post('/', protect, createOrUpsertReview);
router.patch('/:id', protect, updateMyReview);
router.delete('/:id', protect, removeReview);

// Admin moderation
router.get('/moderation', protect, requireRole('admin'), listForModeration);
router.put('/:id/moderate', protect, requireRole('admin'), moderateReview);

export default router;
