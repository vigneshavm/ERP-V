import express from 'express';
import customerRoutes from './customerRoutes.js';
import supplierRoutes from './supplierRoutes.js';
import whatsappRoutes from './whatsappRoutes.js';

const router = express.Router();

router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/whatsapp', whatsappRoutes);

export default router;
