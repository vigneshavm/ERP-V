import express from 'express';
import customer from './customer.routes.js';
import supplier from './supplier.routes.js';

const router = express.Router();

router.use('/customers', customer);
router.use('/suppliers', supplier);

export default router;
