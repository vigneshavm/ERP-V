import express from 'express';
import purchaseOrder from './purchaseOrder.routes.js';
import purchaseReturn from './purchaseReturn.routes.js';
import supplier from './supplier.routes.js';
import supplierGroup from './supplierGroup.routes.js';
import agent from './agent.routes.js';
import extraction from './extraction.routes.js';
import debitNote from './debitNote.routes.js';
import reconciliation from './reconciliation.routes.js';
import rateRevision from './rateRevision.routes.js';

const router = express.Router();

router.use('/returns', purchaseReturn);
router.use('/suppliers', supplier);
router.use('/supplier-groups', supplierGroup);
router.use('/agents', agent);
router.use('/extraction', extraction);
router.use('/debit-notes', debitNote);
router.use('/reconciliation', reconciliation);
// Before '/': otherwise /rate-revisions would be treated as a purchase id.
router.use('/rate-revisions', rateRevision);
router.use('/', purchaseOrder);

export default router;
