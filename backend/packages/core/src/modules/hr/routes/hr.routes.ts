import express from 'express';
import employeeRoutes from './employeeRoutes.js';
import payrollRoutes from './payrollRoutes.js';
import advanceRoutes from './advanceRoutes.js';

const router = express.Router();

router.use('/employees', employeeRoutes);
router.use('/payrolls', payrollRoutes);
router.use('/advances', advanceRoutes);

export default router;
