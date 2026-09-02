import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Return from '../models/Return.js';

import Invoice from '../models/Invoice.js';

import Item from '../../inventory/models/Item.js';

import Customer from '../../crm/models/Customer.js';

import Transaction from '../models/Transaction.js';

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
    deletedEntity?: any;
}

interface ReturnItem {
    productId: string;
    productName: string;
    originalQty: number;
    returnedQty: number;
    rate: number;
    taxPercent: number;
    condition: string;
    reason: string;
}

interface ProcessedReturnItem {
    product: string;
    productName: string;
    originalQty: number;
    returnedQty: number;
    rate: number;
    taxPercent: number;
    taxAmount: number;
    lineTotal: number;
    condition: string;
    reason: string;
    inventoryAdjusted: boolean;
}

interface OriginalPaymentInfo {
    paymentMethod: string;
    paidViaMethod: string;
    creditApplied: number;
    paidAmount: number;
    splitPaymentDetails: any[];
    bankAccount: string;
}

/**
 * @swagger
 * /api/returns:
 *   post:
 *     summary: Create a new sales return
 *     tags: [Sales - Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invoiceId, items]
 *             properties:
 *               invoiceId: { type: string }
 *               items: { type: array, items: { type: object } }
 *               refundMethod: { type: string, enum: [credit, cash, bank_transfer, original_payment] }
 *     responses:
 *       201:
 *         description: Return created successfully
 */
export const createReturn = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {
            invoiceId,
            items,
            refundMethod = 'credit',
            discountAmount = 0,
            notes = '',
        } = req.body;

        info('=== CREATE RETURN REQUEST ===');
        info('Received refundMethod:', { refundMethod });
        info('InvoiceId:', { invoiceId });

        // Validate input
        if (!invoiceId || !items || items.length === 0) {
            res.status(400).json({
                message: 'Invoice ID and items are required',
            });
            return;
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
            res.status(400).json({ message: 'Invalid invoice ID format' });
            return;
        }

        // Fetch and verify invoice belongs to current user
        const invoice = await Invoice.findOne({
            _id: invoiceId,
            createdBy: req.user?._id,
        }).populate('customer').populate('bankAccount');

        if (!invoice) {
            res.status(404).json({
                message: 'Invoice not found or unauthorized',
            });
            return;
        }

        // ========== ORIGINAL PAYMENT DETECTION ==========
        let actualRefundMethod = refundMethod;
        let detectedPaymentInfo: OriginalPaymentInfo | null = null;
        let refundBankAccount = req.body.bankAccount;

        if (refundMethod === 'original_payment') {
            // Capture original payment details
            detectedPaymentInfo = {
                paymentMethod: invoice.paymentMethod,
                paidViaMethod: invoice.paidViaMethod || '',
                creditApplied: invoice.creditApplied || 0,
                paidAmount: invoice.paidAmount || 0,
                splitPaymentDetails: invoice.splitPaymentDetails || [],
                bankAccount: (invoice.bankAccount as any)?._id || invoice.bankAccount,
            };

            // Determine actual refund method based on original payment
            if (invoice.paymentMethod === 'split') {
                // For split payments, default to credit for simplicity
                actualRefundMethod = 'credit';
                info(`Split payment detected for return. Refunding as credit.`);
            } else if (invoice.paymentMethod === 'credit') {
                actualRefundMethod = 'credit';
            } else if (invoice.paymentMethod === 'bank_transfer') {
                actualRefundMethod = 'bank_transfer';
                refundBankAccount = detectedPaymentInfo.bankAccount;

                if (!refundBankAccount) {
                    res.status(400).json({
                        message: 'Original bank account not found. Cannot process refund via original payment method.'
                    });
                    return;
                }
            } else if (invoice.paymentMethod === 'cash') {
                actualRefundMethod = 'cash';
            } else if (invoice.paymentMethod === 'upi' || invoice.paymentMethod === 'card') {
                actualRefundMethod = 'credit';
                info(`Original payment was ${invoice.paymentMethod}. Refunding as credit.`);
            } else {
                actualRefundMethod = invoice.paymentMethod || 'credit';
            }

            info(`Original payment detection: ${invoice.paymentMethod} → Refunding as: ${actualRefundMethod}`);
        } else {
            info('Original payment NOT selected, using refundMethod:', { refundMethod });
        }

        info('FINAL actualRefundMethod:', { actualRefundMethod });
        info('FINAL refundBankAccount:', { refundBankAccount });

        // Check for existing returns for this invoice
        const existingReturns = await Return.find({
            invoice: invoiceId,
            createdBy: req.user?._id,
        });

        // Calculate already returned quantities per product
        const returnedQuantities: Record<string, number> = {};
        existingReturns.forEach((returnRecord: any) => {
            returnRecord.items.forEach((item: any) => {
                const productId = item.product.toString();
                if (!returnedQuantities[productId]) {
                    returnedQuantities[productId] = 0;
                }
                returnedQuantities[productId] += item.returnedQty;
            });
        });

        // Validate all return items
        for (const returnItem of items as ReturnItem[]) {
            // Find matching item in original invoice
            const invoiceItem = invoice.items.find(
                (invItem: any) => invItem.item.toString() === returnItem.productId
            );

            if (!invoiceItem) {
                res.status(400).json({
                    message: `Product ${returnItem.productName} not found in original invoice`,
                });
                return;
            }

            // Check if this item has already been returned
            const alreadyReturned = returnedQuantities[returnItem.productId] || 0;
            const totalReturnQty = alreadyReturned + returnItem.returnedQty;

            // Validate total returned quantity doesn't exceed original quantity
            if (totalReturnQty > invoiceItem.quantity) {
                res.status(400).json({
                    message: `Cannot return ${returnItem.returnedQty} of ${returnItem.productName}. Original quantity: ${invoiceItem.quantity}, Already returned: ${alreadyReturned}, Remaining: ${invoiceItem.quantity - alreadyReturned}`,
                });
                return;
            }

            if (returnItem.returnedQty <= 0) {
                res.status(400).json({
                    message: `Return quantity must be greater than 0 for ${returnItem.productName}`,
                });
                return;
            }

            // Validate condition and reason
            if (!returnItem.condition || !returnItem.reason) {
                res.status(400).json({
                    message: `Condition and reason are required for ${returnItem.productName}`,
                });
                return;
            }
        }

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;

        const processedItems: ProcessedReturnItem[] = [];

        for (const returnItem of items as ReturnItem[]) {
            const lineSubtotal = returnItem.returnedQty * returnItem.rate;
            const lineTax = (lineSubtotal * returnItem.taxPercent) / 100;
            const lineTotal = lineSubtotal + lineTax;

            subtotal += lineSubtotal;
            taxAmount += lineTax;

            processedItems.push({
                product: returnItem.productId,
                productName: returnItem.productName,
                originalQty: returnItem.originalQty,
                returnedQty: returnItem.returnedQty,
                rate: returnItem.rate,
                taxPercent: returnItem.taxPercent,
                taxAmount: lineTax,
                lineTotal: lineTotal,
                condition: returnItem.condition,
                reason: returnItem.reason,
                inventoryAdjusted: false,
            });
        }

        const totalReturnAmount = subtotal + taxAmount - discountAmount;

        // Determine return type
        let isFullReturn = true;
        for (const returnItem of items as ReturnItem[]) {
            const invoiceItem = invoice.items.find(
                (invItem: any) => invItem.item.toString() === returnItem.productId
            );
            if (invoiceItem && returnItem.returnedQty < invoiceItem.quantity) {
                isFullReturn = false;
                break;
            }
        }

        // Check if all invoice items are being returned
        if (isFullReturn && items.length < invoice.items.length) {
            isFullReturn = false;
        }

        const returnType = isFullReturn ? 'full' : 'partial';

        // Generate unique return ID
        const lastReturn = await Return.findOne({ createdBy: req.user?._id })
            .sort({ createdAt: -1 })
            .select('returnId');

        let returnNumber = 1;
        if (lastReturn && lastReturn.returnId) {
            const match = lastReturn.returnId.match(/RET-(\d+)/);
            if (match) {
                returnNumber = parseInt(match[1]) + 1;
            }
        }

        const returnId = `RET-${String(returnNumber).padStart(5, '0')}`;

        // Create return record
        const returnRecord = await Return.create({
            returnId,
            invoice: invoiceId,
            customer: (invoice.customer as any)?._id || null,
            customerName: (invoice.customer as any)?.name || 'Walk-in Customer',
            returnDate: new Date(),
            returnType,
            refundMethod, // What user selected
            actualRefundMethod, // What we actually used
            originalPaymentInfo: detectedPaymentInfo, // For audit trail
            bankAccount: refundBankAccount,
            items: processedItems,
            subtotal,
            taxAmount,
            discountAmount,
            totalReturnAmount,
            status: 'processed',
            notes,
            createdBy: req.user?._id,
        });

        // Update inventory for non-damaged items
        for (const returnItem of processedItems) {
            if (returnItem.condition === 'not_damaged') {
                await Item.findByIdAndUpdate(returnItem.product, {
                    $inc: { stockQty: returnItem.returnedQty },
                });

                // Mark inventory as adjusted
                await Return.findOneAndUpdate(
                    { _id: returnRecord._id, 'items.product': returnItem.product },
                    { $set: { 'items.$.inventoryAdjusted': true } }
                );
            }
        }

        // Update invoice
        await Invoice.findByIdAndUpdate(invoiceId, {
            $inc: { returnedAmount: totalReturnAmount },
            $set: { hasReturns: true },
        });

        // Update customer ledger (reduce dues or create credit)
        if (invoice.customer && actualRefundMethod === 'credit') {
            await Customer.findByIdAndUpdate((invoice.customer as any)._id, {
                $inc: { dues: -totalReturnAmount },
            });
        }

        // Create transaction record (non-critical)
        if (invoice.customer) {
            try {
                await Transaction.create({
                    type: 'return',
                    customer: (invoice.customer as any)._id || invoice.customer,
                    invoice: invoiceId,
                    return: returnRecord._id,
                    amount: totalReturnAmount,
                    paymentMethod: actualRefundMethod,
                    description: `Return processed for invoice ${invoice.invoiceNo} - Return ID: ${returnId}`,
                });
            } catch (txnErr) {
                error(`Return transaction creation failed (non-blocking): ${(txnErr as Error).message}`);
            }
        }

        // Handle Bank Refund (Money OUT)
        info('=== BANK REFUND CHECK ===');
        info('actualRefundMethod:', { actualRefundMethod });
        info('refundBankAccount:', { refundBankAccount });
        info('Condition met?', { conditionMet: actualRefundMethod === 'bank_transfer' && refundBankAccount });

        if (actualRefundMethod === 'bank_transfer' && refundBankAccount) {
            info('Processing bank refund...');
            try {
                //  - Dynamic import
                const BankAccount = (await import('../../finance/models/BankAccount.js')).default;
                //  - Dynamic import
                const CashbankTransactionDyn = (await import('../../finance/models/CashbankTransaction.js')).default;

                const bankAcc = await BankAccount.findOne({
                    _id: refundBankAccount,
                    userId: req.user?._id
                });

                info('Bank account found:', { bankName: bankAcc ? bankAcc.bankName : 'NOT FOUND' });

                if (bankAcc) {
                    // Create cashbank transaction (money OUT - refund to customer)
                    const cashbankTxn = await CashbankTransactionDyn.create({
                        type: 'out',
                        amount: totalReturnAmount,
                        fromAccount: refundBankAccount,
                        toAccount: 'sale_return',
                        description: `Refund for sales return ${returnId}`,
                        date: new Date(),
                        userId: req.user?._id,
                    });

                    info('Cashbank transaction created:', { transactionId: cashbankTxn._id });

                    // Update bank balance (deduct)
                    const updateResult = await BankAccount.updateOne(
                        { _id: refundBankAccount, userId: req.user?._id },
                        {
                            $inc: { currentBalance: -totalReturnAmount },
                            $push: { transactions: cashbankTxn._id }
                        }
                    );

                    info('Bank balance update result:', { updateResult });

                    returnRecord.refundProcessed = true;
                    await returnRecord.save();

                    info(`Bank refund for return ${returnId}: -₹${totalReturnAmount} from ${bankAcc.bankName}`);
                }
            } catch (bankErr) {
                error(`Bank refund processing failed (non-blocking): ${(bankErr as Error).message}`);
            }
        } else if (actualRefundMethod === 'cash') {
            info('Processing cash refund...');
            try {
                // Record cash refund transaction
                const cashTxn = await CashbankTransaction.create({
                    type: 'out',
                    amount: totalReturnAmount,
                    fromAccount: 'cash',
                    toAccount: 'sale_return',
                    description: `Cash refund for sales return ${returnId}`,
                    userId: req.user?._id,
                    date: new Date(),
                });

                info('Cash transaction created:', { transactionId: cashTxn._id });
                info('Amount:', { amount: totalReturnAmount });

                info(`Cash refund for return ${returnId}: -₹${totalReturnAmount}`);
            } catch (cashErr) {
                error(`Cash refund processing failed (non-blocking): ${(cashErr as Error).message}`);
            }
        }


        info(
            `Return created by ${req.user?.name}: ${returnId} for invoice ${invoice.invoiceNo}`
        );

        // Populate and return the created return (best-effort)
        try {
            const populatedReturn = await Return.findById(returnRecord._id)
                .populate('invoice', 'invoiceNo')
                .populate('customer', 'name phone email');

            res.status(201).json({
                message: 'Return created successfully',
                return: populatedReturn,
            });
            return;
        } catch (popErr) {
            error(`Return populate failed (non-blocking): ${(popErr as Error).message}`);
            res.status(201).json({
                message: 'Return created successfully',
                return: returnRecord,
            });
            return;
        }
    } catch (err) {
        error(`Create Return Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/returns:
 *   get:
 *     summary: Get all return records
 *     tags: [Sales - Returns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of returns retrieved
 */
export const getAllReturns = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const returns = await Return.find({ createdBy: req.user?._id })
            .populate('invoice', 'invoiceNo')
            .populate('customer', 'name phone')
            // Needed so the POS Returns Intelligence pages can show who actually processed the
            // return ("Audit Officer") instead of falling back to the customer's name - see
            // POSReturnsIntelligence(MockUI).tsx's cashier mapping.
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(returns);
    } catch (err) {
        error(`Get All Returns Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/returns/{id}:
 *   get:
 *     summary: Get single return record
 *     tags: [Sales - Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Return details retrieved
 */
export const getReturnById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid return ID format' });
            return;
        }

        const returnRecord = await Return.findOne({
            _id: req.params.id,
            createdBy: req.user?._id,
        })
            .populate('invoice', 'invoiceNo totalAmount')
            .populate('customer', 'name phone email address')
            .populate('items.product', 'name sku');

        if (!returnRecord) {
            res.status(404).json({
                message: 'Return not found or unauthorized',
            });
            return;
        }

        res.status(200).json(returnRecord);
    } catch (err) {
        error(`Get Return By ID Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/returns/{id}:
 *   delete:
 *     summary: Delete return record (reverses changes)
 *     tags: [Sales - Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Return deleted and changes reversed
 */
export const deleteReturn = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid return ID format' });
            return;
        }

        const returnRecord = await Return.findOne({
            _id: req.params.id,
            createdBy: req.user?._id,
        });

        if (!returnRecord) {
            res.status(404).json({
                message: 'Return not found or unauthorized',
            });
            return;
        }

        // Attach for audit middleware (before deletion)
        req.deletedEntity = returnRecord.toObject();

        // Reverse inventory adjustments
        for (const item of returnRecord.items) {
            if (item.inventoryAdjusted && item.condition === 'not_damaged') {
                await Item.findByIdAndUpdate(item.product, {
                    $inc: { stockQty: -item.returnedQty },
                });
            }
        }

        // Reverse invoice updates
        await Invoice.findByIdAndUpdate(returnRecord.invoice, {
            $inc: { returnedAmount: -returnRecord.totalReturnAmount },
        });

        // Check if invoice has other returns
        const otherReturns = await Return.countDocuments({
            invoice: returnRecord.invoice,
            _id: { $ne: returnRecord._id },
        });

        if (otherReturns === 0) {
            await Invoice.findByIdAndUpdate(returnRecord.invoice, {
                $set: { hasReturns: false },
            });
        }

        // Reverse customer ledger
        if (returnRecord.customer) {
            await Customer.findByIdAndUpdate(returnRecord.customer, {
                $inc: { dues: returnRecord.totalReturnAmount },
            });
        }

        // Handle Bank Refund Reversal
        if (returnRecord.refundProcessed && returnRecord.bankAccount) {
            //  - Dynamic import
            const BankAccount = (await import('../../finance/models/BankAccount.js')).default;
            //  - Dynamic import
            const CashbankTransactionModel = (await import('../../finance/models/CashbankTransaction.js')).default;

            const bankAcc = await BankAccount.findOne({
                _id: returnRecord.bankAccount,
                userId: req.user?._id
            });

            if (bankAcc) {
                // Find and delete the associated cashbank transaction
                const cashbankTxn = await CashbankTransactionModel.findOne({
                    amount: returnRecord.totalReturnAmount,
                    fromAccount: returnRecord.bankAccount,
                    type: 'out',
                    description: new RegExp(`sales return ${returnRecord.returnId}`),
                    userId: req.user?._id
                });

                if (cashbankTxn) {
                    // Update bank balance (add back the money because 'out' is being reversed)
                    await BankAccount.updateOne(
                        { _id: returnRecord.bankAccount, userId: req.user?._id },
                        {
                            $inc: { currentBalance: returnRecord.totalReturnAmount },
                            $pull: { transactions: cashbankTxn._id }
                        }
                    );

                    // Delete the cashbank transaction
                    await CashbankTransactionModel.findByIdAndDelete(cashbankTxn._id);

                    info(`Bank refund reversed for return ${returnRecord.returnId}: +₹${returnRecord.totalReturnAmount} to ${bankAcc.bankName}`);
                }
            }
        }

        // Delete associated general transactions
        //  - Dynamic import
        const TransactionModel = (await import('../models/Transaction.js')).default;
        await TransactionModel.deleteMany({ return: returnRecord._id });

        // Delete return record
        await Return.findByIdAndDelete(req.params.id as string);

        info(
            `Return deleted by ${req.user?.name}: ${returnRecord.returnId}`
        );

        res.status(200).json({ message: 'Return deleted successfully' });
    } catch (err) {
        error(`Delete Return Error: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export default {
    createReturn,
    getAllReturns,
    getReturnById,
    deleteReturn,
};
