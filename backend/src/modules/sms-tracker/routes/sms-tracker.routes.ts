import express from 'express';
import { receiveSms, getSmsTransactions, convertToExpense, ignoreSms } from '../controllers/SmsTrackerController.js';
import { protect } from '../../../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/sms-tracker/receive
 * @desc    Receive and parse a raw SMS
 * @access  Private
 */
router.post('/receive', protect, receiveSms);

/**
 * @route   GET /api/sms-tracker
 * @desc    Get all pending SMS transactions
 * @access  Private
 */
router.get('/', protect, getSmsTransactions);

/**
 * @route   POST /api/sms-tracker/:id/convert
 * @desc    Convert a parsed SMS to an Expense
 * @access  Private
 */
router.post('/:id/convert', protect, convertToExpense);

/**
 * @route   PATCH /api/sms-tracker/:id/ignore
 * @desc    Ignore an SMS transaction
 * @access  Private
 */
router.patch('/:id/ignore', protect, ignoreSms);

export default router;
