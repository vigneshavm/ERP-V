import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Invoice from '../models/Invoice.js';

import Customer from '../../crm/models/Customer.js';

import CashbankTransaction from '../../finance/models/CashbankTransaction.js';

import BankAccount from '../../finance/models/BankAccount.js';
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
    tenantId?: string; // Injected by Auth Middleware
    deletedEntity?: any;
}

/**
 * @swagger
 * /api/sales-invoice/summary:
 *   get:
 *     summary: Get sales invoice summary
 *     tags: [Sales - Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
 */
export const getSalesInvoiceSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { tenantId } = req;
        // Get all invoices for this tenant
        const invoices = await Invoice.find({ tenantId: tenantId });

        // Calculate invoice totals
        const totalInvoices = invoices.length;
        const totalSales = invoices.reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);
        const totalPaid = invoices.reduce((sum: number, inv: any) => sum + inv.paidAmount, 0);

        // Get actual customer dues (source of truth)
        // Sum all positive dues (customers who owe money)
        const customers = await Customer.find({ tenantId: tenantId });
        const outstandingDues = customers.reduce((sum: number, customer: any) => {
            return sum + (customer.dues > 0 ? customer.dues : 0);
        }, 0);

        res.status(200).json({
            totalInvoices,
            totalSales,
            totalPaid,
            outstandingDues
        });
    } catch (err) {
        error(`Get sales invoice summary failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/sales-invoice/invoices:
 *   get:
 *     summary: Get all sales invoices
 *     tags: [Sales - Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invoices retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invoice'
 */
export const getAllSalesInvoices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const invoices = await Invoice.find({
            tenantId: req.tenantId,
            isDeleted: { $ne: true }
        })
            .populate('customer', 'name phone')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json(invoices);
    } catch (err) {
        error(`Get all sales invoices failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/sales-invoice/invoice/{id}:
 *   get:
 *     summary: Get single sales invoice
 *     tags: [Sales - Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoice details retrieved
 */
export const getSalesInvoiceById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid invoice ID format' });
            return;
        }

        const invoice = await Invoice.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        })
            .populate('customer')
            .populate('items.item', 'name sku');

        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found or unauthorized' });
            return;
        }

        // Transform items to include name property at root level for frontend compatibility
        const transformedInvoice = invoice.toObject();
        transformedInvoice.items = transformedInvoice.items.map((item: any) => ({
            ...item,
            name: item.item?.name || 'Item',
            sku: item.item?.sku || ''
        }));

        res.status(200).json(transformedInvoice);
    } catch (err) {
        error(`Get sales invoice by ID failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/sales-invoice/invoice/{id}:
 *   delete:
 *     summary: Soft-delete sales invoice
 *     tags: [Sales - Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
 *       400:
 *         description: Cannot delete paid/partial invoices
 */
export const deleteSalesInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
            res.status(400).json({ message: 'Invalid invoice ID format' });
            return;
        }

        const invoice = await Invoice.findOne({
            _id: req.params.id,
            tenantId: req.tenantId
        });

        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found or unauthorized' });
            return;
        }

        // ERP-GRADE: Block deletion of paid/partial invoices
        if (invoice.paymentStatus === 'paid' || invoice.paymentStatus === 'partial') {
            res.status(400).json({
                message: 'Cannot delete paid or partially paid invoices. This is forbidden for accounting integrity.'
            });
            return;
        }

        // Attach for audit middleware (before deletion)
        req.deletedEntity = invoice.toObject();

        // ERP-GRADE: Soft delete only
        invoice.isDeleted = true;
        invoice.deletedAt = new Date();
        invoice.deletedBy = req.user?._id;
        await invoice.save();

        // TODO: Implement full rollback for unpaid invoices
        // - Restore stock
        // - Restore reserved stock
        // - Restore in-transit stock
        // - Reverse customer dues
        // - Restore Sales Order state
        // - Add stock movement logging

        res.status(200).json({ message: 'Invoice soft-deleted successfully' });
    } catch (err) {
        error(`Delete sales invoice failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

/**
 * @swagger
 * /api/sales-invoice/invoice/{id}/mark-paid:
 *   put:
 *     summary: Mark sales invoice as paid
 *     tags: [Sales - Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number }
 *               bankAccount: { type: string }
 *               paymentMethod: { type: string, default: bank_transfer }
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 */
export const markSalesInvoiceAsPaid = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { amount, bankAccount, paymentMethod = 'bank_transfer' } = req.body;

        if (!amount || amount <= 0) {
            res.status(400).json({ message: 'Valid payment amount is required' });
            return;
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id as string)) {
            res.status(400).json({ message: 'Invalid invoice ID format' });
            return;
        }

        // Find invoice
        const invoice = await Invoice.findOne({
            _id: id,
            tenantId: req.tenantId
        });

        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found or unauthorized' });
            return;
        }

        // Check if invoice is already fully paid
        if (invoice.paymentStatus === 'paid') {
            res.status(400).json({ message: 'Invoice is already fully paid' });
            return;
        }

        // Validate bank payment
        if (paymentMethod === 'bank_transfer' && bankAccount) {
            const bankAcc = await BankAccount.findOne({ _id: bankAccount, tenantId: req.tenantId });
            if (!bankAcc) {
                res.status(400).json({ message: 'Bank account not found' });
                return;
            }

            if (bankAcc.currentBalance < amount) {
                res.status(400).json({
                    message: `Insufficient balance. Available: ₹${bankAcc.currentBalance}`
                });
                return;
            }
        }

        // Calculate new paid amount and status
        const newPaidAmount = invoice.paidAmount + amount;
        let newPaymentStatus = 'partial';

        if (newPaidAmount >= invoice.totalAmount) {
            newPaymentStatus = 'paid';
        }

        // Update invoice
        const updatedInvoice = await Invoice.findByIdAndUpdate(
            id,
            {
                $set: {
                    paidAmount: newPaidAmount,
                    paymentStatus: newPaymentStatus,
                    paymentMethod: paymentMethod
                }
            },
            { new: true }
        );

        // CRITICAL FIX: Update customer.dues (ATOMIC WITH INVOICE UPDATE)
        if (invoice.customer) {
            const customer = await Customer.findById(invoice.customer);
            if (customer) {
                // Reduce customer dues by payment amount
                customer.dues = Math.max(0, customer.dues - amount);
                await customer.save();

                info(`Customer ledger updated: ${customer.name} dues reduced by ₹${amount}, new balance: ₹${customer.dues}`);
            }
        }

        // Handle bank payment
        if (paymentMethod === 'bank_transfer' && bankAccount) {
            // Create cashbank transaction (money IN)
            const cashbankTxn = await CashbankTransaction.create({
                type: 'in',
                amount,
                fromAccount: 'sale',
                toAccount: bankAccount,
                description: `Payment for invoice ${invoice.invoiceNo}`,
                date: new Date(),
                userId: req.user?._id,
                tenantId: req.tenantId // Enable strict accounting isolation
            });

            // Update bank balance (add)
            await BankAccount.updateOne(
                { _id: bankAccount, tenantId: req.tenantId },
                {
                    $inc: { currentBalance: amount },
                    $push: { transactions: cashbankTxn._id }
                }
            );

            info(`Bank payment recorded for sales invoice ${invoice.invoiceNo}: +₹${amount} to account ${bankAccount}`);
        }

        info(`Sales invoice ${invoice.invoiceNo} marked as ${newPaymentStatus} by ${req.user?.name}: +₹${amount}`);

        res.status(200).json({
            message: `Invoice marked as ${newPaymentStatus}`,
            invoice: updatedInvoice
        });
    } catch (err) {
        error(`Mark sales invoice as paid failed: ${(err as Error).message}`);
        res.status(500).json({ message: 'Server Error', error: (err as Error).message });
    }
};

export default {
    getSalesInvoiceSummary,
    getAllSalesInvoices,
    getSalesInvoiceById,
    deleteSalesInvoice,
    markSalesInvoiceAsPaid,
};
