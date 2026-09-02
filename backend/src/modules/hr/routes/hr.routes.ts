import express from 'express';
import employeeRoutes from './employeeRoutes.js';
import payrollRoutes from './payrollRoutes.js';
import advanceRoutes from './advanceRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';

const router = express.Router();

router.use('/employees', employeeRoutes);
router.use('/payroll', payrollRoutes);
router.use('/advances', advanceRoutes);
// Per-date presence/absence for the Staff Management attendance calendar.
// (Distinct from /payroll/attendance, which only stores manually-typed monthly totals.)
router.use('/attendance', attendanceRoutes);

export default router;
