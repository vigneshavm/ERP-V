import { Router } from 'express';
import purchaseController from '../controllers/PurchaseController.js';
import { getSupplierLedger } from '../controllers/SupplierLedgerController.js';
import { protect } from '../../../middlewares/authMiddleware.js';

const router = Router();

router.post('/', protect, purchaseController.createPurchase);
router.get('/', protect, purchaseController.getAllPurchases);
router.get('/stats/supplier-totals', protect, purchaseController.getSupplierTotals);
router.get('/suppliers/:id/ledger', protect, getSupplierLedger); // Ledger Route - MUST BE BEFORE /:id
router.get('/history/item/:itemId', protect, purchaseController.getPurchaseHistory); // Also move this up just in case
router.get('/:id', protect, purchaseController.getPurchaseById);
router.put('/:id', protect, purchaseController.updatePurchase);
router.delete('/:id', protect, purchaseController.deletePurchase);

import * as rateRevisionController from '../controllers/RateRevisionController.js';

router.post('/rate-revisions', protect, rateRevisionController.createRevision);
router.get('/rate-revisions', protect, rateRevisionController.getRevisions);
router.post('/rate-revisions/:id/approve', protect, rateRevisionController.approveRevision);
router.post('/rate-revisions/:id/reject', protect, rateRevisionController.rejectRevision);

export default router;
