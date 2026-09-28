import express from 'express';
import { container } from 'tsyringe';
import { protect } from '../../../middlewares/authMiddleware.js';
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
import { SupplierGroupController } from '../controllers/SupplierGroupController.js';

const router = express.Router();

router.get('/analytics', protect, getSupplierAnalytics);
router.get('/ageing-analysis', protect, getAgeingAnalysis);
router.get('/reports', protect, getSupplierReports);
router.get('/inflow-outflow', protect, getVendorInflowOutflow);
router.post('/bulk-opening-balance', protect, bulkUpdateOpeningBalance);
router.get('/groups', protect, (req, res) => container.resolve(SupplierGroupController).getGroups(req, res));
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
