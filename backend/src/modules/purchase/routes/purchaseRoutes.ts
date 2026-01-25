import { Router } from 'express';
import purchaseController from '../controllers/PurchaseController.js';
import { protect } from '../../../middlewares/authMiddleware.js';

const router = Router();

router.post('/', protect, purchaseController.createPurchase);
router.get('/', protect, purchaseController.getAllPurchases);
router.get('/:id', protect, purchaseController.getPurchaseById);
router.put('/:id', protect, purchaseController.updatePurchase);
router.delete('/:id', protect, purchaseController.deletePurchase);

export default router;
