import express from 'express';
import purchaseRoutes from './purchaseRoutes.js';
import purchaseReturnRoutes from './purchaseReturnRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import supplierGroupRoutes from './supplierGroupRoutes.js';
import extractionRoutes from './extractionRoutes.js';
import debitNoteRoutes from './debitNoteRoutes.js';

const router = express.Router();

router.use('/', purchaseRoutes);
router.use('/returns', purchaseReturnRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/supplier-groups', supplierGroupRoutes);
router.use('/extraction', extractionRoutes);
router.use('/debit-notes', debitNoteRoutes);

export default router;
