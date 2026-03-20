import express from 'express';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import {
    getSupplierLedger
} from '../controllers/SupplierController.js';

// NOTE: Supplier CRUD and analytics have moved to /crm/suppliers (canonical home).
// This file retains only the /ledger alias used by purchase-report flows.
// New client code should use GET /api/v1/crm/suppliers/:id/ledger instead.

const router = express.Router();

// Deprecated alias — kept for backward compatibility during migration
// Canonical: GET /api/v1/crm/suppliers/:id/ledger
router.get('/:id/ledger', protect, getSupplierLedger);

export default router;
