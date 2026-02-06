import express from 'express';
import employeeRoutes from './employeeRoutes.js';
import payrollRoutes from './payrollRoutes.js';

const router = express.Router();

router.use('/employees', employeeRoutes);
router.use('/payroll', payrollRoutes);

export default router;
