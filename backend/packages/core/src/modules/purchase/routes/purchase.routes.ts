import express from 'express';
import purchaseRoutes from './purchaseRoutes.js';
import purchaseReturnRoutes from './purchaseReturnRoutes.js';
// supplierRoutes import kept — the file retains a deprecated /:id/ledger alias.
import supplierRoutes from './supplierRoutes.js';
import supplierGroupRoutes from './supplierGroupRoutes.js';
import extractionRoutes from './extractionRoutes.js';
import debitNoteRoutes from './debitNoteRoutes.js';
import reconciliationRoutes from './reconciliationRoutes.js';

const router = express.Router();

router.use('/returns', purchaseReturnRoutes);
// /suppliers CRUD removed — canonical home is /api/v1/crm/suppliers
// Deprecated /suppliers/:id/ledger alias retained during migration:
router.use('/suppliers', supplierRoutes);
router.use('/supplier-groups', supplierGroupRoutes);
router.use('/extractions', extractionRoutes);
router.use('/debit-notes', debitNoteRoutes);
router.use('/reconciliations', reconciliationRoutes);
router.use('/', purchaseRoutes);

export default router;
