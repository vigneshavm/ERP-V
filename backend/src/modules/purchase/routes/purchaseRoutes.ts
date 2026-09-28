import { Router } from 'express';
import purchaseController from '../controllers/PurchaseController.js';
import { getSupplierLedger } from '../controllers/SupplierLedgerController.js';
import { protect } from '../../../middlewares/authMiddleware.js';
import * as rateRevisionController from '../controllers/RateRevisionController.js';

const router = Router();

router.post('/', protect, purchaseController.createPurchase);
router.get('/', protect, purchaseController.getAllPurchases);
router.get('/stats/supplier-totals', protect, purchaseController.getSupplierTotals);
router.get('/suppliers/:id/ledger', protect, getSupplierLedger); // Ledger Route - MUST BE BEFORE /:id
router.get('/history/item/:itemId', protect, purchaseController.getPurchaseHistory); // Also move this up just in case
// Rate revisions must be registered before '/:id', otherwise GET /rate-revisions is handled as a purchase id.
router.post('/rate-revisions', protect, rateRevisionController.createRevision);
router.get('/rate-revisions', protect, rateRevisionController.getRevisions);
router.post('/rate-revisions/:id/approve', protect, rateRevisionController.approveRevision);
router.post('/rate-revisions/:id/reject', protect, rateRevisionController.rejectRevision);
router.get('/:id', protect, purchaseController.getPurchaseById);
// updatePOStatus validates via Mongoose (document.save()) and stamps approvedBy/approvedAt/
// sentToVendorAt server-side - this is the route the PO submit/approve/send-to-vendor lifecycle
// actually needs. It previously existed on the controller but was never wired to a route.
router.patch('/:id/status', protect, purchaseController.updatePOStatus);
router.put('/:id', protect, purchaseController.updatePurchase);
router.delete('/:id', protect, purchaseController.deletePurchase);

export default router;
