import express from 'express';
import { protect } from '../../../middlewares/authMiddleware.js';
import {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
    getSupplierAnalytics
} from '../controllers/SupplierController.js';
import { getGroups } from '../controllers/SupplierGroupController.js';

const router = express.Router();

router.get('/analytics', protect, getSupplierAnalytics);
router.get('/groups', protect, getGroups); // Fix for 500 error on /suppliers/groups
router.get('/statements', protect, (_req, res) => {
    // Placeholder to prevent collision with /:id
    res.status(200).json({ success: true, message: "Statements endpoint ready" });
});

router.route('/')
    .post(protect, createSupplier)
    .get(protect, getSuppliers);

router.route('/:id')
    .get(protect, getSupplierById)
    .put(protect, updateSupplier)
    .delete(protect, deleteSupplier);

export default router;
