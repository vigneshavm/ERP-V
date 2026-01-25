import { Request, Response } from 'express';
import mongoose from 'mongoose';

import PurchaseReturn from '../models/PurchaseReturn.js';
// import Bill from '../../../models/Bill.js'; (Unused)
import Supplier from '../../crm/models/Supplier.js';
import BankAccount from '../../finance/models/BankAccount.js';
import CashbankTransaction from '../../finance/models/CashbankTransaction.js';
import { info, error } from '../../../config/logger.js';

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

interface ReturnItem {
    quantity: number;
    rate: number;
    tax: number;
}

/**
 * @swagger
 * /api/purchase-returns:
 *   post:
 *     summary: Create a new purchase return
 *     tags: [Purchase - Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supplierId, items]
 *             properties:
 *               supplierId: { type: string }
 *               items: { type: array, items: { type: object } }
 *     responses:
 *       201:
 *         description: Purchase return created successfully
 */
export const createPurchaseReturn = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            billId,
            supplierId,
            items,
            refundMethod,
            bankAccount,
            discount = 0,
            notes = '',
            returnDate
        } = req.body;

        if (!supplierId || !items || items.length === 0) {
            res.status(400).json({ message: 'Supplier and items are required' });
            return;
        }

        // Calculate totals
        const subtotal = items.reduce((sum: number, item: ReturnItem) => sum + (item.quantity * item.rate), 0);
        const taxAmount = items.reduce((sum: number, item: ReturnItem) => sum + (item.quantity * item.rate * item.tax / 100), 0);
        const totalAmount = subtotal + taxAmount - discount;

        // Generate ID
        const count = await PurchaseReturn.countDocuments({ createdBy: req.user?._id });
        const returnId = `PR-${String(count + 1).padStart(5, '0')}`;

        const purchaseReturn = await PurchaseReturn.create({
            returnId,
            bill: billId || null,
            supplier: supplierId,
            items,
            subtotal,
            taxAmount,
            discountAmount: discount,
            totalAmount,
            refundMethod,
            bankAccount,
            notes,
            returnDate: returnDate || new Date(),
            createdBy: req.user?._id
        });

        // Handle Bank Refund (Money IN)
        if (refundMethod === 'bank_transfer' && bankAccount) {
            const bankAcc = await BankAccount.findOne({ _id: bankAccount, userId: req.user?._id });
            if (!bankAcc) {
                res.status(400).json({ message: 'Bank account not found' });
                return;
            }

            const cashbankTxn = await CashbankTransaction.create({
                type: 'in',
                amount: totalAmount,
                toAccount: bankAccount,
                fromAccount: 'purchase_return',
                description: `Refund for purchase return ${returnId}`,
                date: new Date(),
                userId: req.user?._id,
            });

            await BankAccount.updateOne(
                { _id: bankAccount },
                {
                    $inc: { currentBalance: totalAmount },
                    $push: { transactions: cashbankTxn._id }
                }
            );
            info(`Bank refund received: +₹${totalAmount} to ${bankAcc.bankName}`);
        } else if (refundMethod === 'cash') {
            // Record cash refund transaction
            await CashbankTransaction.create({
                type: 'in',
                amount: totalAmount,
                toAccount: 'cash',
                fromAccount: 'purchase_return',
                description: `Cash refund for purchase return ${returnId}`,
                date: new Date(),
                userId: req.user?._id,
            });

            info(`Cash refund received: +₹${totalAmount}`);
        }

        // Update Supplier Dues (Debit note reduces what we owe)
        await Supplier.findByIdAndUpdate(supplierId, {
            $inc: { dues: -totalAmount }
        });

        res.status(201).json(purchaseReturn);
    } catch (err) {
        error(`Create Purchase Return error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/purchase-returns:
 *   get:
 *     summary: Get all purchase returns
 *     tags: [Purchase - Returns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchase returns retrieved
 */
export const getAllPurchaseReturns = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const returns = await PurchaseReturn.find({ createdBy: req.user?._id })
            .populate('supplier', 'businessName')
            .sort({ createdAt: -1 });
        res.status(200).json(returns);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc Get single purchase return by ID
 * @route GET /api/purchase-returns/:id
 */
/**
 * @swagger
 * /api/purchase-returns/{id}:
 *   get:
 *     summary: Get single purchase return by ID
 *     tags: [Purchase - Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Purchase return details retrieved
 */
export const getPurchaseReturnById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid ID format' });
            return;
        }
        const pr = await PurchaseReturn.findOne({ _id: req.params.id, createdBy: req.user?._id })
            .populate('supplier', 'businessName')
            .populate('bill', 'billNo');
        if (!pr) {
            res.status(404).json({ message: 'Purchase return not found' });
            return;
        }
        res.status(200).json(pr);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

/**
 * @desc Delete purchase return (reversal)
 * @route DELETE /api/purchase-returns/:id
 */
export const deletePurchaseReturn = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id as string)) {
            res.status(400).json({ message: 'Invalid ID format' });
            return;
        }

        const pr = await PurchaseReturn.findOne({ _id: id, createdBy: req.user?._id });
        if (!pr) {
            res.status(404).json({ message: 'Purchase return not found' });
            return;
        }

        // Handle Bank Refund Reversal
        if (pr.refundMethod === 'bank_transfer' && pr.bankAccount) {
            const bankAcc = await BankAccount.findOne({ _id: pr.bankAccount, userId: req.user?._id });
            if (bankAcc) {
                // Find and delete the associated cashbank transaction
                const cashbankTxn = await CashbankTransaction.findOne({
                    amount: pr.totalAmount,
                    toAccount: pr.bankAccount,
                    type: 'in', // IN was reversed, so we deduct it
                    description: new RegExp(`purchase return ${pr.returnId}`),
                    userId: req.user?._id
                });

                if (cashbankTxn) {
                    // Update bank balance (deduct money because 'in' is being reversed)
                    await BankAccount.updateOne(
                        { _id: pr.bankAccount },
                        {
                            $inc: { currentBalance: -pr.totalAmount },
                            $pull: { transactions: cashbankTxn._id }
                        }
                    );
                    await CashbankTransaction.findByIdAndDelete(cashbankTxn._id);
                }
            }
        }

        // Reverse Supplier Dues (Add back the dues because PR reduced them)
        await Supplier.findByIdAndUpdate(pr.supplier, {
            $inc: { dues: pr.totalAmount }
        });

        // Delete the purchase return record
        await PurchaseReturn.findByIdAndDelete(id);

        info(`Purchase return deleted: ${pr.returnId} - Reversed ₹${pr.totalAmount}`);
        res.status(200).json({ message: 'Purchase return deleted and reversed successfully' });
    } catch (err) {
        error(`Delete Purchase Return error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error' });
    }
};

export default {
    createPurchaseReturn,
    getAllPurchaseReturns,
    getPurchaseReturnById,
    deletePurchaseReturn,
};
