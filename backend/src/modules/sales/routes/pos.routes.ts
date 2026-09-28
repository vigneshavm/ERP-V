import express from 'express';
// import posController from '../controllers/POSController.js'; // Existing
import posInvoiceRoutes from './posInvoice.routes.js'; // The actual individual routes file

const router = express.Router();

router.use('/', posInvoiceRoutes);

export default router;
