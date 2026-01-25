import express from 'express';
import purchaseRoutes from './purchaseRoutes.js';
import purchaseReturnRoutes from './purchaseReturnRoutes.js';

const router = express.Router();

router.use('/', purchaseRoutes);
router.use('/returns', purchaseReturnRoutes);

export default router;
