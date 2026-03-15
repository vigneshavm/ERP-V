import express from 'express';
import { protect } from '@smarterp/shared/middlewares/authMiddleware.js';
import {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
    getSupplierAnalytics,
    getSupplierReports,
    getAgeingAnalysis,
    bulkUpdateOpeningBalance,
    getVendorInflowOutflow,
    getSupplierLedger
} from '../controllers/SupplierController.js';
import { getGroups } from '../controllers/SupplierGroupController.js';

const router = express.Router();

router.get('/analytics', protect, getSupplierAnalytics);
router.get('/ageing-analysis', protect, getAgeingAnalysis);
router.get('/reports', protect, getSupplierReports);
router.get('/inflow-outflow', protect, getVendorInflowOutflow);
router.post('/bulk-opening-balance', protect, bulkUpdateOpeningBalance);
router.get('/groups', protect, getGroups); // Fix for 500 error on /suppliers/groups
router.get('/statements', protect, (_req, res) => {
    // Placeholder to prevent collision with /:id
    res.status(200).json({ success: true, message: "Statements endpoint ready" });
});

router.get('/:id/ledger', protect, getSupplierLedger);

router.route('/')
    .post(protect, createSupplier)
    .get(protect, getSuppliers);

router.route('/:id')
    .get(protect, getSupplierById)
    .put(protect, updateSupplier)
    .delete(protect, deleteSupplier);

export default router;
