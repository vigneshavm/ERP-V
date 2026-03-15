import { Router } from 'express';
import { createPayment, getPayments, updatePaymentStatus } from '../controllers/PaymentOutController.js';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';

const router = Router();

router.post('/', protect, createPayment);
router.get('/', protect, getPayments);
router.patch('/:id/status', protect, updatePaymentStatus);

export default router;
