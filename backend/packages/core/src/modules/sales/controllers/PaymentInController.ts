import { Request, Response } from 'express';
import mongoose from 'mongoose';
import PaymentIn from '../models/PaymentIn.js';
import Customer from '@smarterp/core/modules/crm/models/Customer.js';
import Invoice from '../models/Invoice.js';
import Transaction from '../models/Transaction.js';
import CashbankTransaction from '@smarterp/core/modules/finance/models/CashbankTransaction.js';
import BankAccount from '@smarterp/core/modules/finance/models/BankAccount.js';
import { info, error } from '@smarterp/shared/config/logger.js';
import { asyncHandler } from '@smarterp/shared/utils/asyncHandler.js';
import { ok, created, paginated } from '@smarterp/shared/utils/response.js';

/**
 * Request interface with authenticated user
 */
interface PaymentMethod {
    method: string;
    amount: number;
    bankAccount?: string;
}

interface InvoiceAllocation {
    invoice: string;
    allocatedAmount: number;
    invoiceBalanceBefore?: number;
}

/**
 * @swagger
 * /api/payment-in:
 *   post:
 *     summary: Create a new payment-in record
 *     tags: [Sales - Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, paymentMethods, depositAccount]
 *             properties:
 *               customerId: { type: string }
 *               paymentMethods: { type: array, items: { type: object } }
 *               depositAccount: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 */
export const createPaymentIn = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const {
        customerId,
        paymentMethods,
        allocatedInvoices = [],
        creditApplied = 0,
        depositAccount,
        notes = '',
    } = req.body;

    // ===== VALIDATION =====

    // 1. Validate customer
    if (!customerId) {
        res.status(400).json({ message: 'Customer is required' });
        return;
    }

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
        res.status(400).json({ message: 'Invalid customer ID format' });
        return;
    }

    const customer = await Customer.findOne({
        _id: customerId,
        owner: req.user!._id,
    });

    if (!customer) {
        res.status(404).json({
            message: 'Customer not found or unauthorized',
        });
        return;
    }

    // 2. Validate payment methods
    if (!paymentMethods || paymentMethods.length === 0) {
        res.status(400).json({
            message: 'At least one payment method is required',
        });
        return;
    }

    let totalPayment = 0;
    for (const pm of paymentMethods as PaymentMethod[]) {
        if (!pm.method || !pm.amount || pm.amount <= 0) {
            res.status(400).json({
                message: 'Invalid payment method data',
            });
            return;
        }
        totalPayment += parseFloat(String(pm.amount));

        // Validate bank account if specified
        if (pm.bankAccount) {
            if (!mongoose.Types.ObjectId.isValid(pm.bankAccount)) {
                res.status(400).json({
                    message: 'Invalid bank account ID format',
                });
                return;
            }
            const bankAccount = await BankAccount.findOne({
                _id: pm.bankAccount,
                userId: req.user!._id,
            });
            if (!bankAccount) {
                res.status(400).json({
                    message: 'Bank account not found or unauthorized',
                });
                return;
            }
        }
    }

    // Round to 2 decimal places
    totalPayment = Math.round(totalPayment * 100) / 100;

    // 3. Validate deposit account
    if (!depositAccount) {
        res.status(400).json({
            message: 'Deposit account is required',
        });
        return;
    }

    if (depositAccount !== 'cash') {
        if (!mongoose.Types.ObjectId.isValid(depositAccount)) {
            res.status(400).json({
                message: 'Invalid deposit account ID format',
            });
            return;
        }
        const depositBankAccount = await BankAccount.findOne({
            _id: depositAccount,
            userId: req.user!._id,
        });
        if (!depositBankAccount) {
            res.status(400).json({
                message: 'Deposit account not found or unauthorized',
            });
            return;
        }
    }

    // 4. Validate credit applied
    if (creditApplied < 0) {
        res.status(400).json({
            message: 'Credit applied cannot be negative',
        });
        return;
    }

    if (creditApplied > 0) {
        const availableCredit = customer.dues < 0 ? Math.abs(customer.dues) : 0;
        if (creditApplied > availableCredit) {
            res.status(400).json({
                message: `Credit applied (₹${creditApplied}) exceeds available credit (₹${availableCredit.toFixed(2)})`,
            });
            return;
        }
    }

    // 5. Validate invoice allocations
    let totalAllocated = 0;
    const validatedAllocations: InvoiceAllocation[] = [];

    for (const allocation of allocatedInvoices as InvoiceAllocation[]) {
        if (!allocation.invoice || !allocation.allocatedAmount) {
            res.status(400).json({
                message: 'Invalid invoice allocation data',
            });
            return;
        }

        if (allocation.allocatedAmount <= 0) {
            res.status(400).json({
                message: 'Allocated amount must be greater than zero',
            });
            return;
        }

        if (!mongoose.Types.ObjectId.isValid(allocation.invoice)) {
            res.status(400).json({
                message: 'Invalid invoice ID format',
            });
            return;
        }

        const invoice = await Invoice.findOne({
            _id: allocation.invoice,
            createdBy: req.user!._id,
            customer: customerId,
        });

        if (!invoice) {
            res.status(404).json({
                message: `Invoice not found or does not belong to this customer`,
            });
            return;
        }

        const invoiceBalance =
            invoice.totalAmount - invoice.paidAmount - invoice.returnedAmount;

        if (allocation.allocatedAmount > invoiceBalance) {
            res.status(400).json({
                message: `Allocated amount (₹${allocation.allocatedAmount}) exceeds invoice balance (₹${invoiceBalance.toFixed(2)}) for invoice ${invoice.invoiceNo}`,
            });
            return;
        }

        totalAllocated += parseFloat(String(allocation.allocatedAmount));
        validatedAllocations.push({
            invoice: allocation.invoice,
            allocatedAmount: allocation.allocatedAmount,
            invoiceBalanceBefore: invoiceBalance,
        });
    }

    totalAllocated = Math.round(totalAllocated * 100) / 100;

    // 6. Calculate effective payment and excess
    const effectivePayment = totalPayment + creditApplied;
    const excessAmount = Math.max(0, effectivePayment - totalAllocated);

    // Validate that we're not over-allocating
    if (totalAllocated > effectivePayment) {
        res.status(400).json({
            message: `Total allocated (₹${totalAllocated}) exceeds total payment (₹${effectivePayment.toFixed(2)})`,
        });
        return;
    }

    // ===== CREATE RECORDS =====

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create PaymentIn record
    const paymentIn = await PaymentIn.create({
        receiptNumber,
        customer: customerId,
        paymentDate: req.body.paymentDate || new Date(),
        totalAmount: totalPayment,
        paymentMethods,
        allocatedInvoices: validatedAllocations,
        creditApplied,
        excessAmount,
        depositAccount,
        notes,
        createdBy: req.user!._id,
    });

    // ===== UPDATE INVOICES =====
    for (const allocation of validatedAllocations) {
        const invoice = await Invoice.findById(allocation.invoice);
        if (!invoice) continue;

        const newPaidAmount = invoice.paidAmount + allocation.allocatedAmount;
        const newBalance =
            invoice.totalAmount - newPaidAmount - invoice.returnedAmount;

        let newPaymentStatus = 'unpaid';
        if (newBalance <= 0.01) {
            newPaymentStatus = 'paid';
        } else if (newPaidAmount > 0) {
            newPaymentStatus = 'partial';
        }

        await Invoice.findByIdAndUpdate(
            allocation.invoice,
            {
                $inc: { paidAmount: allocation.allocatedAmount },
                paymentStatus: newPaymentStatus,
            }
        );
    }

    // ===== UPDATE CUSTOMER DUES =====
    // Logic:
    // 1. totalAllocated: Amount paid against invoices -> REDUCE dues
    // 2. creditApplied: Using existing credit (negative dues) -> INCREASE dues (consume credit)
    // 3. excessAmount: Payment more than invoices -> REDUCE dues (create credit)
    //
    // Net change in dues = -totalAllocated + creditApplied - excessAmount
    // Simplified: -(totalAllocated - creditApplied + excessAmount)

    const duesChange = creditApplied - totalAllocated - excessAmount;

    await Customer.findByIdAndUpdate(
        customerId,
        {
            $inc: { dues: duesChange },
        }
    );

    // ===== CREATE TRANSACTION RECORDS =====
    if (totalAllocated > 0) {
        await Transaction.create({
            type: 'payment',
            customer: customerId,
            amount: totalAllocated,
            paymentMethod: paymentMethods.length === 1 ? paymentMethods[0].method : 'split',
            description: `Payment received - Receipt ${receiptNumber}`,
        });
    }

    if (creditApplied > 0) {
        await Transaction.create({
            type: 'payment',
            customer: customerId,
            amount: creditApplied,
            paymentMethod: 'credit',
            description: `Customer credit applied - Receipt ${receiptNumber}`,
        });
    }

    if (excessAmount > 0) {
        await Transaction.create({
            type: 'payment',
            customer: customerId,
            amount: -excessAmount,
            paymentMethod: 'credit',
            description: `Excess payment - Customer credit created - Receipt ${receiptNumber}`,
        });
    }

    // ===== UPDATE CASH/BANK BALANCE =====
    await CashbankTransaction.create({
        type: 'in',
        amount: totalPayment,
        fromAccount: 'external',
        toAccount: depositAccount,
        description: `Payment In - Receipt ${receiptNumber} - Customer: ${customer.name}`,
        reference: receiptNumber,
        userId: req.user!._id,
    });

    if (depositAccount !== 'cash') {
        await BankAccount.findByIdAndUpdate(
            depositAccount,
            {
                $inc: { currentBalance: totalPayment },
            }
        );
    }

    info(
        `Payment In created by ${req.user!.name}: Receipt ${receiptNumber} - ₹${totalPayment} from ${customer.name}`
    );

    // Populate and return
    const populatedPayment = await PaymentIn.findById(paymentIn._id)
        .populate('customer', 'name phone email dues')
        .populate('allocatedInvoices.invoice', 'invoiceNo totalAmount paidAmount paymentStatus')
        .populate('createdBy', 'name email');

    res.status(201).json({
        message: 'Payment recorded successfully',
        payment: populatedPayment,
    });

/**
 * @swagger
 * /api/payment-in:
 *   get:
 *     summary: Get all payment-in records
 *     tags: [Sales - Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment records retrieved
 */
export const getPaymentInRecords = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const payments = await PaymentIn.find({ createdBy: req.user!._id })
        .populate('customer', 'name phone email')
        .populate('allocatedInvoices.invoice', 'invoiceNo totalAmount')
        .populate('createdBy', 'name email')
        .sort({ paymentDate: -1 });

    res.status(200).json(payments);

/**
 * @swagger
 * /api/payment-in/{id}:
 *   get:
 *     summary: Get single payment-in record
 *     tags: [Sales - Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment record details retrieved
 */
export const getPaymentInById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
        res.status(400).json({ message: 'Invalid payment ID format' });
        return;
    }

    const payment = await PaymentIn.findOne({
        _id: req.params.id,
        createdBy: req.user!._id,
    })
        .populate('customer', 'name phone email dues')
        .populate('allocatedInvoices.invoice', 'invoiceNo totalAmount paidAmount paymentStatus')
        .populate('createdBy', 'name email');

    if (!payment) {
        res.status(404).json({
            message: 'Payment record not found or unauthorized',
        });
        return;
    }

    // Get customer's current dues for message calculation
    const customer = await Customer.findById(payment.customer._id);
    const customerCurrentDues = customer ? customer.dues : 0;

    // Add customer dues to response
    const paymentWithDues: any = payment.toObject();
    paymentWithDues.customerCurrentDues = customerCurrentDues;

    res.status(200).json(paymentWithDues);

/**
 * @swagger
 * /api/payment-in/customer/{customerId}/invoices:
 *   get:
 *     summary: Get customer's outstanding invoices
 *     tags: [Sales - Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of outstanding invoices for the customer
 */
export const getCustomerOutstandingInvoices = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId as string)) {
        res.status(400).json({ message: 'Invalid customer ID format' });
        return;
    }

    // Verify customer belongs to user
    const customer = await Customer.findOne({
        _id: customerId,
        owner: req.user!._id,
    });

    if (!customer) {
        res.status(404).json({
            message: 'Customer not found or unauthorized',
        });
        return;
    }

    // Fetch unpaid and partially paid invoices
    const invoices = await Invoice.find({
        customer: customerId,
        createdBy: req.user!._id,
        paymentStatus: { $in: ['unpaid', 'partial'] },
    })
        .select('invoiceNo createdAt totalAmount paidAmount returnedAmount paymentStatus')
        .sort({ createdAt: -1 });

    // Calculate balance for each invoice
    const invoicesWithBalance = invoices.map((inv: any) => ({
        _id: inv._id,
        invoiceNo: inv.invoiceNo,
        date: inv.createdAt,
        total: inv.totalAmount,
        paid: inv.paidAmount,
        returned: inv.returnedAmount,
        balance: inv.totalAmount - inv.paidAmount - inv.returnedAmount,
        paymentStatus: inv.paymentStatus,
    }));

    res.status(200).json(invoicesWithBalance);

/**
 * @swagger
 * /api/payment-in/customer/{customerId}/info:
 *   get:
 *     summary: Get customer's payment information
 *     tags: [Sales - Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Customer dues, credits, and outstanding invoices retrieved
 */
export const getCustomerPaymentInfo = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> =>{
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId as string)) {
        res.status(400).json({ message: 'Invalid customer ID format' });
        return;
    }

    // Verify customer belongs to user
    const customer = await Customer.findOne({
        _id: customerId,
        owner: req.user!._id,
    });

    if (!customer) {
        res.status(404).json({
            message: 'Customer not found or unauthorized',
        });
        return;
    }

    // Calculate outstanding due and available credit
    const outstandingDue = customer.dues > 0 ? customer.dues : 0;
    const availableCredit = customer.dues < 0 ? Math.abs(customer.dues) : 0;

    // Fetch outstanding invoices
    const invoices = await Invoice.find({
        customer: customerId,
        createdBy: req.user!._id,
        paymentStatus: { $in: ['unpaid', 'partial'] },
    })
        .select('invoiceNo createdAt totalAmount paidAmount returnedAmount paymentStatus')
        .sort({ createdAt: -1 });

    const invoicesWithBalance = invoices.map((inv: any) => ({
        _id: inv._id,
        invoiceNo: inv.invoiceNo,
        date: inv.createdAt,
        total: inv.totalAmount,
        paid: inv.paidAmount,
        returned: inv.returnedAmount,
        balance: inv.totalAmount - inv.paidAmount - inv.returnedAmount,
        paymentStatus: inv.paymentStatus,
    }));

    res.status(200).json({
        customer: {
            _id: customer._id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
        },
        outstandingDue,
        availableCredit,
        outstandingInvoices: invoicesWithBalance,
    });

export default {
    createPaymentIn,
    getPaymentInRecords,
    getPaymentInById,
    getCustomerOutstandingInvoices,
    getCustomerPaymentInfo,
};
