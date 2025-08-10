import { Router } from 'express';
import { listServices, getService, createService, updateService, removeService } from '../controllers/serviceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();

router.get('/', listServices);
router.get('/:id', getService);

// Admin or provider can manage services
router.post('/', protect, requireRole('admin', 'provider'), createService);
router.put('/:id', protect, requireRole('admin', 'provider'), updateService);
router.delete('/:id', protect, requireRole('admin'), removeService);

export default router;