import express from 'express';
import { protect } from '../../../middlewares/authMiddleware.js';
import {
    createEMIPlan,
    getEMIPlans,
    recordInstallmentPayment,
    deleteEMIPlan
} from '../controllers/EMIPlanController.js';

const router = express.Router();

router.route('/')
    .post(protect, createEMIPlan)
    .get(protect, getEMIPlans);

router.patch('/:id/installments/pay', protect, recordInstallmentPayment);
router.delete('/:id', protect, deleteEMIPlan);

export default router;
