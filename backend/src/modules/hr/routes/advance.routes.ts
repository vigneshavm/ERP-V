import express from 'express';
import { createAdvance, getEmployeeAdvances, getAllAdvances } from '../controllers/AdvanceController.js';
import { protect } from '../../../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createAdvance);
router.get('/', protect, getAllAdvances);
router.get('/employee/:employeeId', protect, getEmployeeAdvances);

export default router;
