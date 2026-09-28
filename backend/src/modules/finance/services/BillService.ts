import { injectable, inject } from "tsyringe";
import mongoose from "mongoose";
import { BillRepository, IBillFilter } from "../repositories/BillRepository.js";
import { CashBankRepository } from "../repositories/CashBankRepository.js";
import { IBill } from "../models/Bill.js";
import { AppError } from "../../../utils/AppError.js";
import { info } from "../../../config/logger.js";

@injectable()
export class BillService {
    constructor(
        @inject(BillRepository) private billRepository: BillRepository,
        @inject(CashBankRepository) private cashBankRepository: CashBankRepository
    ) { }

    async generateBillNo(tenantId: string): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `BILL-${dateStr}`;

        const lastBill = await this.billRepository.findLastBillByPrefix(prefix, tenantId);

        let sequence = 1;
        if (lastBill && lastBill.billNo) {
            const parts = lastBill.billNo.split('-');
            if (parts.length >= 3) {
                const lastSequence = parseInt(parts[2], 10);
                if (!isNaN(lastSequence)) {
                    sequence = lastSequence + 1;
                }
            }
        }

        return `${prefix}-${sequence.toString().padStart(3, '0')}`;
    }

    async getAllBills(tenantId: string, filters?: IBillFilter): Promise<IBill[]> {
        return this.billRepository.findAll(tenantId, filters);
    }

    async getBillById(id: string, tenantId: string): Promise<IBill> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid bill ID format", 400);
        }

        const bill = await this.billRepository.findById(id, tenantId);
        if (!bill) {
            throw new AppError("Bill not found or unauthorized", 404);
        }

        return bill;
    }

    async createBill(tenantId: string, userId: string, data: any): Promise<IBill> {
        const {
            date,
            supplier,
            amount: amountRaw,
            vendorInvoiceNo,
            items,
            subTotal,
            discount,
            freight,
            roundOff,
            taxBreakdown,
            grnId,
            purchaseOrderId,
            paymentTerms,
            dueDate,
            status: _status,
            description,
            paymentMethod = 'cash',
            paidAmount: paidAmountRaw = 0,
            bankAccount
        } = data;

        const paidAmount = Number(paidAmountRaw) || 0;
        const amount = Number(amountRaw);

        if (!date || !supplier || !amount) {
            throw new AppError("Date, supplier, and amount are required", 400);
        }

        if (!mongoose.Types.ObjectId.isValid(supplier)) {
            throw new AppError("Invalid supplier ID format", 400);
        }

        if (bankAccount && !mongoose.Types.ObjectId.isValid(bankAccount)) {
            throw new AppError("Invalid bank account ID format", 400);
        }

        let paymentStatus: 'paid' | 'unpaid' | 'partial' = 'unpaid';
        if (paidAmount >= amount) {
            paymentStatus = 'paid';
        } else if (paidAmount > 0) {
            paymentStatus = 'partial';
        }

        if (paymentMethod === 'bank_transfer' && paidAmount > 0) {
            if (!bankAccount) {
                throw new AppError("Bank account is required for bank transfer", 400);
            }

            const bankAcc = await this.cashBankRepository.findAccountById(bankAccount, tenantId);
            if (!bankAcc) {
                throw new AppError("Bank account not found", 404);
            }

            if (bankAcc.currentBalance < paidAmount) {
                throw new AppError(`Insufficient balance. Available: ₹${bankAcc.currentBalance}`, 400);
            }
        }

        const billNo = await this.generateBillNo(tenantId);

        const billData: Partial<IBill> = {
            billNo,
            vendorInvoiceNo,
            date,
            supplier,
            amount,
            items: items || [],
            subTotal: subTotal || 0,
            discount: discount || 0,
            freight: freight || 0,
            roundOff: roundOff || 0,
            taxBreakdown: taxBreakdown || { cgst: 0, sgst: 0, igst: 0, other: 0 },
            grnId,
            purchaseOrderId,
            dueDate: dueDate || undefined,
            paymentTerms,
            status: paymentStatus === 'paid' ? 'paid' : (_status || 'unpaid'),
            description,
            paymentMethod,
            paidAmount,
            bankAccount: (bankAccount && mongoose.Types.ObjectId.isValid(bankAccount)) ? bankAccount : undefined,
            paymentStatus,
            tenantId,
            createdBy: new mongoose.Types.ObjectId(userId)
        };

        const bill = await this.billRepository.create(billData);

        if (paymentMethod === 'bank_transfer' && paidAmount > 0) {
            await this.cashBankRepository.createTransaction({
                type: 'out',
                amount: paidAmount,
                fromAccount: bankAccount,
                toAccount: 'purchase',
                description: `Payment for bill ${billNo}`,
                date: new Date(),
                userId
            }, tenantId);

            await this.cashBankRepository.updateBalance(bankAccount, tenantId, -paidAmount);
            info(`Bank payment for bill ${billNo}: -₹${paidAmount} from account ${bankAccount}`);
        }

        const populated = await this.billRepository.findById(bill._id.toString(), tenantId);
        return populated || bill;
    }

    async updateBill(id: string, tenantId: string, updates: any): Promise<IBill> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid bill ID format", 400);
        }

        const existing = await this.billRepository.findById(id, tenantId);
        if (!existing) {
            throw new AppError("Bill not found or unauthorized", 404);
        }

        if (updates.bankAccount === '') {
            updates.bankAccount = undefined;
        }

        const updated = await this.billRepository.update(id, tenantId, updates);
        if (!updated) {
            throw new AppError("Update bill failed", 500);
        }

        return updated;
    }

    async deleteBill(id: string, tenantId: string): Promise<void> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid bill ID format", 400);
        }

        const bill = await this.billRepository.findById(id, tenantId);
        if (!bill) {
            throw new AppError("Bill not found or unauthorized", 404);
        }

        await this.billRepository.delete(id, tenantId);
    }

    async updateBillPayment(id: string, tenantId: string, userId: string, paymentData: any): Promise<IBill> {
        const { paymentMethod, bankAccount } = paymentData;
        const paidAmount = Number(paymentData.paidAmount);

        if (isNaN(paidAmount) || paidAmount <= 0) {
            throw new AppError("Valid payment amount required", 400);
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError("Invalid bill ID format", 400);
        }

        const bill = await this.billRepository.findById(id, tenantId);
        if (!bill) {
            throw new AppError("Bill not found", 404);
        }

        const newPaidAmount = bill.paidAmount + paidAmount;

        if (newPaidAmount > bill.amount) {
            throw new AppError(`Payment amount exceeds bill total. Remaining: ₹${bill.amount - bill.paidAmount}`, 400);
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
                throw new AppError("Bank account is required for bank transfer", 400);
            }

            const bankAcc = await this.cashBankRepository.findAccountById(bankAccount, tenantId);
            if (!bankAcc) {
                throw new AppError("Bank account not found", 404);
            }

            if (bankAcc.currentBalance < paidAmount) {
                throw new AppError(`Insufficient balance. Available: ₹${bankAcc.currentBalance}`, 400);
            }

            await this.cashBankRepository.createTransaction({
                type: 'out',
                amount: paidAmount,
                fromAccount: bankAccount,
                toAccount: 'purchase',
                description: `Payment for bill ${bill.billNo}`,
                date: new Date(),
                userId
            }, tenantId);

            await this.cashBankRepository.updateBalance(bankAccount, tenantId, -paidAmount);
            info(`Bank payment for bill ${bill.billNo}: -₹${paidAmount}`);
        } else if (paymentMethod === 'cash') {
            await this.cashBankRepository.createTransaction({
                type: 'out',
                amount: paidAmount,
                fromAccount: 'cash',
                toAccount: 'purchase',
                description: `Cash payment for bill ${bill.billNo}`,
                date: new Date(),
                userId
            }, tenantId);

            info(`Cash payment for bill ${bill.billNo}: -₹${paidAmount}`);
        }

        const updates: Partial<IBill> = {
            paidAmount: newPaidAmount,
            paymentStatus,
            status: billStatus,
            paymentMethod,
            bankAccount: (bankAccount && mongoose.Types.ObjectId.isValid(bankAccount)) ? bankAccount : undefined
        };

        const updated = await this.billRepository.update(id, tenantId, updates);
        if (!updated) {
            throw new AppError("Failed to update bill payment", 500);
        }

        return updated;
    }
}
