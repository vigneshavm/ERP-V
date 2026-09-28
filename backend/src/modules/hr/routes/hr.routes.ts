import express from 'express';
import employee from './employee.routes.js';
import payroll from './payroll.routes.js';
import advance from './advance.routes.js';
import attendance from './attendance.routes.js';

const router = express.Router();

router.use('/employees', employee);
router.use('/payroll', payroll);
router.use('/advances', advance);
// Per-date presence/absence for the Staff Management attendance calendar.
// (Distinct from /payroll/attendance, which only stores manually-typed monthly totals.)
router.use('/attendance', attendance);

export default router;
