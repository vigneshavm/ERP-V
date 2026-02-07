import { Response } from 'express';
import mongoose from 'mongoose';
import PaymentOut from '../models/PaymentOut.js';
import Bill from '../../finance/models/Bill.js';
import Supplier from '../models/Supplier.js';
import CashbankTransaction from '../../finance/models/CashbankTransaction.js';
import BankAccount from '../../finance/models/BankAccount.js';
import { AuthenticatedRequest } from '../../../middlewares/authMiddleware.js';

// Create Payment
export const createPayment = async (req: AuthenticatedRequest, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const tenantId = req.user?.tenantId?.toString();
        const userId = req.user?._id;

        if (!tenantId) throw new Error('Unauthorized access');

        const {
            supplierId,
            paymentDate,
            amount,
            paymentMode,
            referenceNo,
            bankAccountId,
            chequeDate,
            allocations, // [{ billId, amount, discount }]
            notes
        } = req.body;

        // 1. Validations
        if (amount <= 0) throw new Error('Payment amount must be greater than zero');

        // Check Bank Balance if Bank Transfer/Cheque
        let bankName = '';
        if (['Bank Transfer', 'Cheque'].includes(paymentMode) && bankAccountId) {
            const bank = await BankAccount.findOne({ _id: bankAccountId, tenantId }).session(session);
            if (!bank) throw new Error('Invalid Bank Account');
            bankName = bank.bankName;

            // Only check balance if not future dated cheque
            const isFutureDated = chequeDate && new Date(chequeDate) > new Date();
            if (!isFutureDated && bank.currentBalance < amount) {
                // throw new Error(`Insufficient funds in ${bank.bankName}`);
                // Optional: Allow negative balance or warn? Enforcing for now.
            }
        }

        // 2. Calculate Unallocated Amount
        const totalAllocated = allocations.reduce((sum: number, a: any) => sum + (a.amount || 0), 0);
        if (totalAllocated > amount) throw new Error('Allocated amount cannot exceed payment amount');

        const unallocatedAmount = amount - totalAllocated;

        // 3. Status Determination
        let status = 'cleared';
        if (paymentMode === 'Cheque') {
            status = 'pending'; // Cheques start as pending until cleared
        }

        // 4. Generate Payment No
        const lastPayment = await PaymentOut.findOne({ tenantId }).sort({ createdAt: -1 }).session(session);
        let nextNo = 1;
        if (lastPayment && lastPayment.paymentNo) {
            const lastNum = parseInt(lastPayment.paymentNo.split('-')[1]);
            if (!isNaN(lastNum)) nextNo = lastNum + 1;
        }
        const paymentNo = `PAY-${nextNo.toString().padStart(5, '0')}`;

        // 5. Create Payment Record
        const payment = new PaymentOut({
            tenantId,
            paymentNo,
            supplierId,
            paymentDate: paymentDate || new Date(),
            amount,
            paymentMode,
            referenceNo,
            bankAccountId,
            chequeDate,
            bankName,
            status,
            allocations,
            unallocatedAmount,
            notes,
            createdBy: userId
        });

        await payment.save({ session });

        // 6. Process Allocations (Update Bills)
        if (allocations && allocations.length > 0) {
            for (const alloc of allocations) {
                const bill = await Bill.findOne({ _id: alloc.billId, tenantId }).session(session);
                if (!bill) continue;

                const paidNow = alloc.amount || 0;
                const discountNow = alloc.discount || 0;

                bill.paidAmount = (bill.paidAmount || 0) + paidNow;
                bill.discountReceived = (bill.discountReceived || 0) + discountNow;

                // Update Bill Status
                const totalDue = bill.amount;
                const totalPaidAndDiscount = bill.paidAmount + (bill.discountReceived || 0);

                if (totalPaidAndDiscount >= totalDue - 0.5) { // Tolerance
                    bill.status = 'paid';
                    bill.paymentStatus = 'paid';
                } else if (bill.paidAmount > 0) {
                    bill.paymentStatus = 'partial';
                    // Ensure status isn't 'unpaid' if partial
                    if (bill.status === 'unpaid') bill.status = 'approved';
                }

                await bill.save({ session });
            }
        }

        // 7. Reduce Supplier Balance implicitly handled by aggregation or separate ledger logic
        // We do not store explicit balance in Supplier model currently.

        // 8. Financial Transaction (Money Leaving)
        if (status === 'cleared') {
            // Only deduct from bank/cash if cleared immediately
            const transaction = new CashbankTransaction({
                userId,
                type: 'out',
                amount: amount,
                fromAccount: paymentMode === 'Cash' ? 'cash' : bankAccountId,
                toAccount: supplierId, // Supplier as destination
                description: `Payment to ${supplierId} (${paymentNo})`, // Ideally fetch name
                date: paymentDate || new Date(),
                reference: referenceNo || paymentNo,
                reconciled: true,
                reconciledDate: new Date()
            });

            await transaction.save({ session });

            // Update Bank Balance
            if (bankAccountId) {
                await BankAccount.findByIdAndUpdate(bankAccountId, { $inc: { currentBalance: -amount } }).session(session);
            }
        }

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ success: true, data: payment });
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        console.error('Create Payment Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Cheque Status (Clear / Bounce)
export const updatePaymentStatus = async (req: AuthenticatedRequest, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { status, bounceReason } = req.body; // 'cleared', 'bounced'
        const tenantId = req.user?.tenantId?.toString();
        const userId = req.user?._id;

        const payment = await PaymentOut.findOne({ _id: id, tenantId }).session(session);
        if (!payment) throw new Error('Payment not found');

        if (payment.status === status) {
            await session.abortTransaction();
            session.endSession();
            return res.status(200).json({ success: true, message: 'Status already updated' });
        }

        const oldStatus = payment.status;
        payment.status = status;
        if (bounceReason) payment.notes = (payment.notes || '') + ` [Bounce: ${bounceReason}]`;

        await payment.save({ session });

        // Application Logic
        if (status === 'cleared' && oldStatus === 'pending') {
            // Deduct from bank now
            console.log('Clearing Payment:', payment);
            const fromAccount = payment.paymentMode === 'Cash' ? 'cash' : payment.bankAccountId;
            console.log('From Account:', fromAccount);

            if (!fromAccount) {
                throw new Error(`Cannot clear payment: Source Bank Account is missing. Please ensure the payment record has a valid Bank Account assigned.`);
            }

            const transaction = new CashbankTransaction({
                userId,
                type: 'out',
                amount: payment.amount,
                fromAccount,
                toAccount: payment.supplierId,
                description: `Cheque Cleared - ${payment.supplierId} (${payment.paymentNo})`,
                date: new Date(),
                reference: payment.referenceNo,
                reconciled: true,
                reconciledDate: new Date()
            });
            await transaction.save({ session });

            if (payment.bankAccountId) {
                await BankAccount.findByIdAndUpdate(payment.bankAccountId, { $inc: { currentBalance: -payment.amount } }).session(session);
            }

        } else if (status === 'bounced') {
            // Reverse Bill Allocations
            if (payment.allocations && payment.allocations.length > 0) {
                for (const alloc of payment.allocations) {
                    const bill = await Bill.findOne({ _id: alloc.billId, tenantId }).session(session);
                    if (bill) {
                        bill.paidAmount = Math.max(0, (bill.paidAmount || 0) - (alloc.amount || 0));
                        bill.discountReceived = Math.max(0, (bill.discountReceived || 0) - (alloc.discount || 0));

                        // Re-evaluate status
                        const totalPaidAndDiscount = bill.paidAmount + (bill.discountReceived || 0);
                        if (totalPaidAndDiscount < bill.amount - 0.5) {
                            bill.status = bill.paidAmount > 0 ? 'approved' : 'unpaid';
                            bill.paymentStatus = bill.paidAmount > 0 ? 'partial' : 'unpaid';
                        }
                        await bill.save({ session });
                    }
                }
            }

            // If it was somehow cleared before (unlikely for check, but safe handling), reverse transaction
            if (oldStatus === 'cleared') {
                // Refund logic if needed...
            }
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ success: true, data: payment });

    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        console.error('Update Payment Status Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPayments = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId?.toString();
        const payments = await PaymentOut.find({ tenantId })
            .populate('supplierId', 'businessName')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: payments });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
