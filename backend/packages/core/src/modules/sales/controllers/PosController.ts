import { Request, Response } from "express";
import mongoose from "mongoose";
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { error } from '@smarterp/shared/config/logger.js';
import Item from '@smarterp/core/modules/inventory/models/Item.js';
import Invoice from '@smarterp/core/modules/sales/models/Invoice.js';
import Customer from '@smarterp/core/modules/crm/models/Customer.js';
import CashbankTransaction from '@smarterp/core/modules/finance/models/CashbankTransaction.js';
import BankAccount from '@smarterp/core/modules/finance/models/BankAccount.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';

/**
 * @desc    Get all POS products (placeholder)
 * @route   GET /api/pos/products
 * @access  Private
 */
export const getPosProducts = asyncHandler(async (_req: Request, res: Response): Promise<void> =>{
    // TODO: Implement POS product fetching logic
    res.status(200).json({
        success: true,
        message: "Get POS products"
    });
});

/**
 * @swagger
 * /api/pos/summary:
 *   get:
 *     summary: Get POS summary
 *     tags: [Sales - POS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: POS summary retrieved
 */
export const getPosSummary = asyncHandler(async (_req: Request, res: Response): Promise<void> =>{
    res.status(200).json({ message: 'POS summary endpoint' });
});

/**
 * @swagger
 * /api/pos/sale:
 *   post:
 *     summary: Process a POS sale
 *     tags: [Sales - POS]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: POS sale processed
 */
export const processPosSale = asyncHandler(async (_req: Request, res: Response): Promise<void> =>{
    res.status(201).json({ message: 'POS sale processed' });
});

/**
 * @desc    Create a new POS Invoice
 * @route   POST /api/pos/invoice
 * @access  Private
 */
export const createInvoice = asyncHandler(async (req: Request, res: Response): Promise<void> =>{
    const session = await mongoose.startSession();
    session.startTransaction();

    const {
        customerId,
        items,
        discount = 0,
        paymentMethod,
        bankAccount,
        paidAmount = 0,
        changeReturned = 0,
        splitPaymentDetails = [],
        creditApplied = 0,
        previousDueAmount = 0
    } = req.body;

    // 1. Basic Validation
    if (!items || items.length === 0) {
        throw new AppError("Cart is empty", 400);
    }

    const totalPaid = Number(paidAmount) || 0;
    const totalChange = Number(changeReturned) || 0;
    const actualReceived = totalPaid - totalChange;

    // 2. Process Items & Calculate Totals
    let subtotal = 0;
    let taxTotal = 0;
    const processedItems = [];

    for (const item of items) {
        // Use findById directly for better error handling if needed, but findOne with tenantId is safer
        const product = await Item.findOne({ _id: item.item || item._id, tenantId: req.tenantId }).session(session);

        if (!product) {
            throw new AppError(`Item not found: ${item.name}`, 404);
        }

        if (product.stockQty < item.quantity) {
            throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.stockQty}`, 400);
        }

        // Calculate Item Totals
        const itemTotal = item.quantity * item.price;
        subtotal += itemTotal;

        const taxAmount = (itemTotal * (item.tax || 0)) / 100;
        taxTotal += taxAmount;

        processedItems.push({
            item: product._id,
            quantity: item.quantity,
            price: item.price,
            total: itemTotal,
            tax: item.tax || 0,
            discount: item.discount || 0
        });

        // 3. Update Stock
        product.stockQty -= item.quantity;
        await product.save({ session });
    }

    const finalTotal = subtotal + taxTotal - discount;

    // 4. Create Invoice
    const lastInvoice = await Invoice.findOne({ tenantId: req.tenantId }).sort({ createdAt: -1 }).session(session);
    let nextInvoiceNum = 1;
    if (lastInvoice && lastInvoice.invoiceNo) {
        const match = lastInvoice.invoiceNo.match(/-(\d+)$/);
        if (match) nextInvoiceNum = parseInt(match[1]) + 1;
    }
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(nextInvoiceNum).padStart(5, '0')}`;

    const paymentStatus = (actualReceived + creditApplied) >= finalTotal ? 'paid' : (actualReceived > 0 ? 'partial' : 'unpaid');

    // Handling Due/Credit
    let customer = null;
    if (customerId) {
        customer = await Customer.findOne({ _id: customerId, tenantId: req.tenantId }).session(session);
        if (customer) {
            const amountToPay = finalTotal;
            const totalCovered = actualReceived + creditApplied;
            const balanceDue = amountToPay - totalCovered;

            if (balanceDue > 0) {
                customer.dues += balanceDue;
            }

            if (creditApplied > 0) {
                customer.dues += creditApplied;
            }

            await customer.save({ session });
        }
    }

    // Duplicate paymentStatus key fix
    const invoiceData = {
        invoiceNo,
        customer: customerId || null,
        items: processedItems,
        subtotal,
        tax: taxTotal,
        discount,
        totalAmount: finalTotal,
        paidAmount: actualReceived,
        creditApplied,
        previousDueAmount,
        paymentStatus,
        paymentMethod,
        splitPaymentDetails,
        bankAccount: bankAccount || null,
        tenantId: req.tenantId,
        createdBy: req.user!._id
    };

    const newInvoice = await Invoice.create([invoiceData], { session });

    // 5. Handle Money In (Cashbank)
    if (actualReceived > 0) {
        if (paymentMethod === 'split') {
            for (const split of splitPaymentDetails) {
                if (Number(split.amount) > 0) {
                    await CashbankTransaction.create([{
                        type: 'in',
                        amount: Number(split.amount),
                        fromAccount: 'sale',
                        toAccount: split.method === 'cash' ? 'cash_in_hand' : (bankAccount || 'bank_account'),
                        description: `Split Sale: ${invoiceNo} (${split.method})`,
                        date: new Date(),
                        userId: req.user!._id,
                        tenantId: req.tenantId,
                        referenceId: newInvoice[0]._id,
                        referenceModel: 'Invoice'
                    }], { session });
                }
            }
        } else {
            let toAccount = 'cash_in_hand';
            if (paymentMethod === 'bank_transfer' && bankAccount) {
                toAccount = bankAccount;
                await BankAccount.findOneAndUpdate(
                    { _id: bankAccount, tenantId: req.tenantId },
                    { $inc: { currentBalance: actualReceived } },
                    { session }
                );
            }

            await CashbankTransaction.create([{
                type: 'in',
                amount: actualReceived,
                fromAccount: 'sale',
                toAccount: paymentMethod === 'cash' ? 'cash' : toAccount,
                description: `POS Sale: ${invoiceNo}`,
                date: new Date(),
                userId: req.user!._id,
                tenantId: req.tenantId,
                referenceId: newInvoice[0]._id,
                referenceModel: 'Invoice'
            }], { session });
        }
    }

    await session.commitTransaction();
    res.status(201).json({
        success: true,
        message: "Invoice created successfully",
        invoice: newInvoice[0]
    });
});


export default {
    getPosProducts,
    getPosSummary,
    processPosSale,
    createInvoice
};
