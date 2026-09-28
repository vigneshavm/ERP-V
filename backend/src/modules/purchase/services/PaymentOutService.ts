import { injectable, inject } from "tsyringe";
import { PaymentOutRepository } from "../repositories/PaymentOutRepository.js";
import { AppError } from "../../../utils/AppError.js";
import { IPaymentOut } from "../models/PaymentOut.js";
import { info } from "../../../config/logger.js";
import mongoose from "mongoose";
import Bill from "../../finance/models/Bill.js";
import CashbankTransaction from "../../finance/models/CashbankTransaction.js";
import BankAccount from "../../finance/models/BankAccount.js";

@injectable()
export class PaymentOutService {
    constructor(
        @inject(PaymentOutRepository) private paymentOutRepository: PaymentOutRepository
    ) { }

    async createPayment(tenantId: string, userId: string, body: any): Promise<IPaymentOut> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const {
                supplierId,
                paymentDate,
                amount,
                paymentMode,
                referenceNo,
                bankAccountId,
                chequeDate,
                allocations = [],
                notes
            } = body;

            if (!supplierId) {
                throw new AppError("Supplier ID is required", 400);
            }

            if (amount <= 0) {
                throw new AppError("Payment amount must be greater than zero", 400);
            }

            // Validate bank account if needed
            let bankName = '';
            if (['Bank Transfer', 'Cheque'].includes(paymentMode) && bankAccountId) {
                const bank = await BankAccount.findOne({ _id: bankAccountId, tenantId }).session(session);
                if (!bank) {
                    throw new AppError("Invalid bank account", 400);
                }
                bankName = bank.bankName;
            }

            // Validate allocations
            const totalAllocated = allocations.reduce((sum: number, a: any) => sum + (a.amount || 0), 0);
            if (totalAllocated > amount) {
                throw new AppError("Allocated amount cannot exceed payment amount", 400);
            }

            const unallocatedAmount = amount - totalAllocated;

            // Determine status
            let status: IPaymentOut['status'] = 'cleared';
            if (paymentMode === 'Cheque') {
                status = 'pending';
            }

            // Generate payment number
            const lastPayment = await this.paymentOutRepository.findLatestByTenant(tenantId);
            let nextNo = 1;
            if (lastPayment && lastPayment.paymentNo) {
                const match = lastPayment.paymentNo.match(/-(\d+)$/);
                if (match) nextNo = parseInt(match[1]) + 1;
            }
            const paymentNo = `PAY-${nextNo.toString().padStart(5, '0')}`;

            // Create payment
            const payment = await this.paymentOutRepository.create(
                {
                    tenantId,
                    paymentNo,
                    supplierId: supplierId as any,
                    paymentDate: paymentDate || new Date(),
                    amount,
                    paymentMode,
                    referenceNo,
                    bankAccountId: bankAccountId as any,
                    chequeDate,
                    bankName,
                    status,
                    allocations,
                    unallocatedAmount,
                    notes,
                    createdBy: userId as any
                },
                session
            );

            // Process allocations - update bills
            if (allocations && allocations.length > 0) {
                for (const alloc of allocations) {
                    const bill = await Bill.findOne({ _id: alloc.billId, tenantId }).session(session);
                    if (!bill) continue;

                    const paidNow = alloc.amount || 0;
                    const discountNow = alloc.discount || 0;

                    bill.paidAmount = (bill.paidAmount || 0) + paidNow;
                    bill.discountReceived = (bill.discountReceived || 0) + discountNow;

                    const totalDue = bill.amount;
                    const totalPaidAndDiscount = bill.paidAmount + (bill.discountReceived || 0);

                    if (totalPaidAndDiscount >= totalDue - 0.5) {
                        bill.status = 'paid';
                        bill.paymentStatus = 'paid';
                    } else if (bill.paidAmount > 0) {
                        bill.paymentStatus = 'partial';
                        if (bill.status === 'unpaid') bill.status = 'approved';
                    }

                    await bill.save({ session });
                }
            }

            // Create bank transaction if cleared
            if (status === 'cleared' && paymentMode !== 'Discount Received') {
                const transaction = new CashbankTransaction({
                    userId: userId as any,
                    tenantId: new mongoose.Types.ObjectId(tenantId),
                    type: 'out',
                    amount,
                    fromAccount: paymentMode === 'Cash' ? 'cash' : bankAccountId,
                    toAccount: supplierId,
                    description: `Payment (${paymentNo})`,
                    date: paymentDate || new Date(),
                    reference: referenceNo || paymentNo,
                    reconciled: true,
                    reconciledDate: new Date()
                });

                await transaction.save({ session });

                // Update bank balance
                if (bankAccountId) {
                    await BankAccount.findByIdAndUpdate(
                        bankAccountId,
                        { $inc: { currentBalance: -amount } }
                    ).session(session);
                }
            }

            await session.commitTransaction();
            info(`Payment created: ${paymentNo}`);
            return payment;
        } catch (err: any) {
            await session.abortTransaction();
            throw err;
        } finally {
            session.endSession();
        }
    }

    async getPayments(tenantId: string): Promise<IPaymentOut[]> {
        return this.paymentOutRepository.findAll(tenantId);
    }

    async getPaymentById(id: string, tenantId: string): Promise<IPaymentOut> {
        const payment = await this.paymentOutRepository.findById(id, tenantId);
        if (!payment) {
            throw new AppError("Payment not found", 404);
        }
        return payment;
    }

    async updatePaymentStatus(id: string, tenantId: string, newStatus: string): Promise<IPaymentOut> {
        const payment = await this.getPaymentById(id, tenantId);

        if (!['pending', 'cleared', 'bounced', 'cancelled'].includes(newStatus)) {
            throw new AppError("Invalid payment status", 400);
        }

        const updated = await this.paymentOutRepository.update(id, tenantId, { status: newStatus as any });
        if (!updated) {
            throw new AppError("Failed to update payment status", 500);
        }

        info(`Payment status updated: ${payment.paymentNo} → ${newStatus}`);
        return updated;
    }
}
