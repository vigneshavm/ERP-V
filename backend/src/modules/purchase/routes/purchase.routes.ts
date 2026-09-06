import express from 'express';
import purchaseRoutes from './purchaseRoutes.js';
import purchaseReturnRoutes from './purchaseReturnRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import supplierGroupRoutes from './supplierGroupRoutes.js';
import agentRoutes from './agentRoutes.js';
import extractionRoutes from './extractionRoutes.js';
import debitNoteRoutes from './debitNoteRoutes.js';
import reconciliationRoutes from './reconciliationRoutes.js';

const router = express.Router();

router.use('/returns', purchaseReturnRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/supplier-groups', supplierGroupRoutes);
router.use('/agents', agentRoutes);
router.use('/extraction', extractionRoutes);
router.use('/debit-notes', debitNoteRoutes);
router.use('/reconciliation', reconciliationRoutes);
router.use('/', purchaseRoutes);

export default router;
