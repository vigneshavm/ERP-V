import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Bill from '../models/Bill.js';

import CashbankTransaction from '../models/CashbankTransaction.js';

import BankAccount from '../models/BankAccount.js';
import { error, info } from '../../../config/logger.js';

/**
 * Request interface with authenticated user
 */
interface AuthenticatedRequest extends Request {
    user?: {
        _id: string;
        name?: string;
        [key: string]: any;
    };
}

// Generate bill number: BILL-YYYYMMDD-XXX
const generateBillNo = async (userId: string): Promise<string> => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `BILL-${dateStr}`;

    // Find last bill number for today
    const lastBill = await Bill.findOne({
        billNo: new RegExp(`^${prefix}`),
        createdBy: userId
    }).sort({ billNo: -1 });

    let sequence = 1;
    if (lastBill && lastBill.billNo) {
        const parts = lastBill.billNo.split('-');
        if (parts.length >= 3) {
            const lastSequence = parseInt(parts[2]);
            if (!isNaN(lastSequence)) {
                sequence = lastSequence + 1;
            }
        }
    }

    return `${prefix}-${sequence.toString().padStart(3, '0')}`;
};

/**
 * @swagger
 * /api/bills:
 *   get:
 *     summary: Get all bills
 *     tags: [Finance - Bills]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bills retrieved
 */
export const getAllBills = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const bills = await Bill.find({ createdBy: req.user?._id })
            .populate('supplier', 'businessName')
            .sort({ createdAt: -1 });
        res.status(200).json(bills);
    } catch (err) {
        error(`Get all bills failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/bills:
 *   post:
 *     summary: Create new bill
 *     tags: [Finance - Bills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, supplier, amount]
 *             properties:
 *               date: { type: string, format: date }
 *               supplier: { type: string }
 *               amount: { type: number }
 *     responses:
 *       201:
 *         description: Bill created successfully
 */
export const createBill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            date,
            supplier,
            amount: amountRaw,
            dueDate,
            status: _status,
            description,
            paymentMethod = 'cash',
            paidAmount: paidAmountRaw = 0,
            bankAccount
        } = req.body;

        const paidAmount = Number(paidAmountRaw);
        const amount = Number(amountRaw);

        if (!date || !supplier || !amount) {
            res.status(400).json({
                message: 'Date, supplier, and amount are required'
            });
            return;
        }

        // Validate supplier ObjectId
        if (!mongoose.Types.ObjectId.isValid(supplier)) {
            res.status(400).json({ message: 'Invalid supplier ID format' });
            return;
        }

        // Validate bankAccount ObjectId if provided
        if (bankAccount && !mongoose.Types.ObjectId.isValid(bankAccount)) {
            res.status(400).json({ message: 'Invalid bank account ID format' });
            return;
        }

        // Calculate payment status
        let paymentStatus: 'paid' | 'unpaid' | 'partial' = 'unpaid';
        if (paidAmount >= amount) {
            paymentStatus = 'paid';
        } else if (paidAmount > 0) {
            paymentStatus = 'partial';
        }

        // Validate bank payment
        if (paymentMethod === 'bank_transfer' && paidAmount > 0) {
            if (!bankAccount) {
                res.status(400).json({
                    message: 'Bank account is required for bank transfer'
                });
                return;
            }

            const bankAcc = await BankAccount.findOne({
                _id: bankAccount,
                userId: req.user?._id
            });

            if (!bankAcc) {
                res.status(400).json({ message: 'Bank account not found' });
                return;
            }

            if (bankAcc.currentBalance < paidAmount) {
                res.status(400).json({
                    message: `Insufficient balance. Available: ₹${bankAcc.currentBalance}`
                });
                return;
            }
        }

        // Generate bill number
        const billNo = await generateBillNo(req.user?._id || '');

        // Create bill
        const bill = new Bill({
            billNo,
            date,
            supplier,
            amount,
            dueDate: dueDate || undefined,
            status: paymentStatus === 'paid' ? 'paid' : 'unpaid',
            description,
            paymentMethod,
            paidAmount,
            bankAccount: (bankAccount && mongoose.Types.ObjectId.isValid(bankAccount)) ? bankAccount : undefined,
            paymentStatus,
            createdBy: req.user?._id
        });

        await bill.save();

        // Handle bank payment
        if (paymentMethod === 'bank_transfer' && paidAmount > 0) {
            // Create cashbank transaction (money OUT)
            const cashbankTxn = await CashbankTransaction.create({
                type: 'out',
                amount: paidAmount,
                fromAccount: bankAccount,
                toAccount: 'purchase',
                description: `Payment for bill ${billNo}`,
                date: new Date(),
                userId: req.user?._id,
            });

            // Update bank balance (deduct)
            await BankAccount.updateOne(
                { _id: bankAccount, userId: req.user?._id },
                {
                    $inc: { currentBalance: -paidAmount },
                    $push: { transactions: cashbankTxn._id }
                }
            );

            info(`Bank payment for bill ${billNo}: -₹${paidAmount} from account ${bankAccount}`);
        }

        // Return bill with populated supplier
        const result = await Bill.findById(bill._id).populate('supplier', 'businessName');

        res.status(201).json(result);
    } catch (err) {
        error(`Create bill failed: ${(err as Error).stack || (err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/bills/{id}:
 *   get:
 *     summary: Get single bill
 *     tags: [Finance - Bills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Bill details retrieved
 */
export const getBillById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid bill ID format' });
            return;
        }

        const bill = await Bill.findOne({
            _id: req.params.id,
            createdBy: req.user?._id
        }).populate('supplier');

        if (!bill) {
            res.status(404).json({ message: 'Bill not found or unauthorized' });
            return;
        }

        res.status(200).json(bill);
    } catch (err) {
        error(`Get bill by ID failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Update bill
 * @route PUT /api/bills/:id
 */
export const updateBill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid bill ID format' });
            return;
        }

        const bill = await Bill.findOne({
            _id: req.params.id,
            createdBy: req.user?._id
        });

        if (!bill) {
            res.status(404).json({ message: 'Bill not found or unauthorized' });
            return;
        }

        if (req.body.bankAccount === '') {
            req.body.bankAccount = undefined;
        }

        const updatedBill = await Bill.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('supplier', 'businessName');

        res.status(200).json(updatedBill);
    } catch (err) {
        error(`Update bill failed: ${(err as Error).stack || (err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Delete bill
 * @route DELETE /api/bills/:id
 */
export const deleteBill = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid bill ID format' });
            return;
        }

        const bill = await Bill.findOne({
            _id: req.params.id,
            createdBy: req.user?._id
        });

        if (!bill) {
            res.status(404).json({ message: 'Bill not found or unauthorized' });
            return;
        }

        await bill.deleteOne();
        res.status(200).json({ message: 'Bill deleted' });
    } catch (err) {
        error(`Delete bill failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @desc Update bill payment
 * @route PUT /api/bills/:id/payment
 */
export const updateBillPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { paymentMethod, bankAccount } = req.body;
        const paidAmount = Number(req.body.paidAmount);

        if (isNaN(paidAmount) || paidAmount <= 0) {
            res.status(400).json({ message: 'Valid payment amount required' });
            return;
        }

        if (!mongoose.Types.ObjectId.isValid(id as string)) {
            res.status(400).json({ message: 'Invalid bill ID format' });
            return;
        }

        const bill = await Bill.findOne({ _id: id, createdBy: req.user?._id });
        if (!bill) {
            res.status(404).json({ message: 'Bill not found' });
            return;
        }

        const newPaidAmount = bill.paidAmount + paidAmount;

        if (newPaidAmount > bill.amount) {
            res.status(400).json({
                message: `Payment amount exceeds bill total. Remaining: ₹${bill.amount - bill.paidAmount}`
            });
            return;
        }

        let paymentStatus: 'paid' | 'unpaid' | 'partial' = 'unpaid';
        let billStatus: 'paid' | 'unpaid' = 'unpaid';

        if (newPaidAmount >= bill.amount) {
            paymentStatus = 'paid';
            billStatus = 'paid';
        } else if (newPaidAmount > 0) {
            paymentStatus = 'partial';
            billStatus = 'unpaid';
        }

        if (paymentMethod === 'bank_transfer') {
            if (!bankAccount) {
                res.status(400).json({
                    message: 'Bank account is required for bank transfer'
                });
                return;
            }

            const bankAcc = await BankAccount.findOne({
                _id: bankAccount,
                userId: req.user?._id
            });

            if (!bankAcc) {
                res.status(400).json({ message: 'Bank account not found' });
                return;
            }

            if (bankAcc.currentBalance < paidAmount) {
                res.status(400).json({
                    message: `Insufficient balance. Available: ₹${bankAcc.currentBalance}`
                });
                return;
            }

            const cashbankTxn = await CashbankTransaction.create({
                type: 'out',
                amount: paidAmount,
                fromAccount: bankAccount,
                toAccount: 'purchase',
                description: `Payment for bill ${bill.billNo}`,
                date: new Date(),
                userId: req.user?._id,
            });

            await BankAccount.updateOne(
                { _id: bankAccount, userId: req.user?._id },
                {
                    $inc: { currentBalance: -paidAmount },
                    $push: { transactions: cashbankTxn._id }
                }
            );

            info(`Bank payment for bill ${bill.billNo}: -₹${paidAmount}`);
        } else if (paymentMethod === 'cash') {
            await CashbankTransaction.create({
                type: 'out',
                amount: paidAmount,
                fromAccount: 'cash',
                toAccount: 'purchase',
                description: `Cash payment for bill ${bill.billNo}`,
                userId: req.user?._id,
            });

            info(`Cash payment for bill ${bill.billNo}: -₹${paidAmount}`);
        }

        bill.paidAmount = newPaidAmount;
        bill.paymentStatus = paymentStatus;
        bill.status = billStatus;
        bill.paymentMethod = paymentMethod;
        if (bankAccount && mongoose.Types.ObjectId.isValid(bankAccount)) {
            bill.bankAccount = bankAccount;
        } else {
            bill.bankAccount = undefined;
        }
        await bill.save();

        await bill.populate('supplier', 'businessName');

        res.status(200).json({
            message: 'Payment recorded successfully',
            bill
        });
    } catch (err) {
        error(`Update bill payment failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export default {
    getAllBills,
    createBill,
    getBillById,
    updateBill,
    deleteBill,
    updateBillPayment,
};
