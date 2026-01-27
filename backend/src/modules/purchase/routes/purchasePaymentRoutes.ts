import { Router } from 'express';
import purchasePaymentController from '../controllers/PurchasePaymentController.js';
import { protect } from '../../../middlewares/authMiddleware.js';

const router = Router();

router.post('/', protect, purchasePaymentController.createPayment);
router.get('/', protect, purchasePaymentController.getAllPayments);

export default router;
