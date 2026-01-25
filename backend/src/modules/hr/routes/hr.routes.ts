import express from 'express';
import employeeRoutes from './employeeRoutes.js';
// import attendanceRoutes from './attendanceRoutes.js'; // Placeholder
// import leaveRoutes from './leaveRoutes.js'; // Placeholder

const router = express.Router();

router.use('/employees', employeeRoutes);
// router.use('/attendance', attendanceRoutes);
// router.use('/leave', leaveRoutes);

export default router;
