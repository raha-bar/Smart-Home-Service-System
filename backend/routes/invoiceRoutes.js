// backend/routes/invoiceRoutes.js
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
  generateInvoice,
  myInvoices,
  myProviderInvoices,
  getInvoice,
  markPaid,
  voidInvoice,
  listAll
} from '../controllers/invoiceController.js';

const router = Router();

// create / generate
router.post('/generate', protect, requireRole('admin','provider'), generateInvoice);

// self views
router.get('/me', protect, myInvoices);
router.get('/provider/me', protect, requireRole('provider'), myProviderInvoices);

// admin list
router.get('/', protect, requireRole('admin'), listAll);

// invoice item + actions
router.get('/:id', protect, getInvoice);
router.put('/:id/pay', protect, requireRole('admin','provider'), markPaid);
router.put('/:id/void', protect, requireRole('admin'), voidInvoice);

export default router;
