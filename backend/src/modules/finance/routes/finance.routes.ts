import express from 'express';
import bill from './bill.routes.js';
import cashBank from './cashBank.routes.js';
import due from './due.routes.js';
import loyalty from './loyalty.routes.js';
import dayEnd from './dayEnd.routes.js';
import pettyCash from './pettyCash.routes.js';

const router = express.Router();

router.use('/bills', bill);
router.use('/cashbank', cashBank);
router.use('/due', due);
router.use('/loyalty', loyalty);
router.use('/day-end', dayEnd);
router.use('/petty-cash', pettyCash);

// Bank Statement
import bankStatement from './bankStatement.routes.js';
router.use('/bank-statement', bankStatement);

// Loans
import loan from './loan.routes.js';
router.use('/loans', loan);

// Daily Finance entries (Daily Finance screen + offline queue replay)
import dailyFinance from './dailyFinance.routes.js';
import { protect } from "../../../middlewares/authMiddleware.js";
router.use('/daily-finance', dailyFinance);

// Mount Journal Entry routes
import journalEntry from './journalEntry.routes.js';
router.use('/journal', journalEntry);

// Mount Clearing Parameter routes
import clearingParameter from './clearingParameter.routes.js';
router.use('/clearing', clearingParameter);

// GST Routes (GSTR-1 sales export)
import { getGSTR1Report, exportGSTR1 } from '../controllers/GSTR1Controller.js';
router.get('/gst/gstr1',        protect, getGSTR1Report);
router.get('/gst/gstr1/export', protect, exportGSTR1);

export default router;
