import { Router } from 'express';
import { container } from 'tsyringe';
import { protect } from '../../../middlewares/authMiddleware.js';
import { PaymentOutController } from '../controllers/PaymentOutController.js';

const router = Router();

router.post('/', protect, (req, res) => container.resolve(PaymentOutController).createPayment(req, res));
router.get('/', protect, (req, res) => container.resolve(PaymentOutController).getPayments(req, res));
router.patch('/:id/status', protect, (req, res) => container.resolve(PaymentOutController).updatePaymentStatus(req, res));

export default router;
