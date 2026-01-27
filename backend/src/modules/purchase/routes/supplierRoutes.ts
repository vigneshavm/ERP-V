import express from 'express';
import { protect } from '../../../middlewares/authMiddleware.js';
import {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
} from '../controllers/SupplierController.js';

const router = express.Router();

router.route('/')
    .post(protect, createSupplier)
    .get(protect, getSuppliers);

router.route('/:id')
    .get(protect, getSupplierById)
    .put(protect, updateSupplier)
    .delete(protect, deleteSupplier);

export default router;
