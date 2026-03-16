import express from 'express';
// import posController from '../controllers/POSController.js'; // Existing
import posRoutes from './posRoutes.js'; // The actual individual routes file
const router = express.Router();
router.use('/', posRoutes);
export default router;
