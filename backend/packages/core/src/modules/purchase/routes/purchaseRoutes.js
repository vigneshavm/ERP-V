import { Router } from 'express';
import purchaseController from '../controllers/PurchaseController.js';
// getSupplierLedger import removed — route moved to crm/supplierRoutes.ts
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
const router = Router();
router.post('/', protect, purchaseController.createPurchase);
router.get('/', protect, purchaseController.getAllPurchases);
router.get('/stats/supplier-totals', protect, purchaseController.getSupplierTotals);
// Supplier ledger moved to canonical home: GET /api/v1/crm/suppliers/:id/ledger
// Deprecated alias retained in purchase/supplierRoutes.ts during migration.
router.get('/history/item/:itemId', protect, purchaseController.getPurchaseHistory); // Also move this up just in case
router.get('/:id', protect, purchaseController.getPurchaseById);
router.put('/:id', protect, purchaseController.updatePurchase);
router.delete('/:id', protect, purchaseController.deletePurchase);
import * as rateRevisionController from '../controllers/RateRevisionController.js';
router.post('/rate-revisions', protect, rateRevisionController.createRevision);
router.get('/rate-revisions', protect, rateRevisionController.getRevisions);
// PATCH /:id/status is the REST-compliant replacement for /approve and /reject.
// The request body carries { status: 'approved' | 'rejected', reason?: string }.
router.patch('/rate-revisions/:id/status', protect, rateRevisionController.approveRevision);
export default router;
