import express from 'express';
import customer from './customer.routes.js';
import supplier from './supplier.routes.js';
import whatsapp from './whatsapp.routes.js';

const router = express.Router();

router.use('/customers', customer);
router.use('/suppliers', supplier);
router.use('/whatsapp', whatsapp);

export default router;
