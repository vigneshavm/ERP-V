var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { injectable, inject } from "tsyringe";
import { BillRepository } from '../repositories/BillRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { info } from '@smarterp/shared/config/logger.js';
import { ObjectId } from "mongodb";
let BillService = class BillService {
    billRepository;
    constructor(billRepository) {
        this.billRepository = billRepository;
    }
    async getAllBills(userId, filters) {
        const query = { createdBy: userId };
        if (filters.supplier)
            query.supplier = filters.supplier;
        if (filters.status)
            query.status = filters.status;
        if (filters.paymentStatus) {
            const statuses = filters.paymentStatus.split(',');
            query.paymentStatus = statuses.length > 1 ? { $in: statuses } : filters.paymentStatus;
        }
        return this.billRepository.findBills(query);
    }
    async getAllBillsPaginated(userId, page, limit, sort, filters) {
        const query = { createdBy: userId };
        if (filters.supplier)
            query.supplier = filters.supplier;
        if (filters.status)
            query.status = filters.status;
        if (filters.paymentStatus) {
            const statuses = filters.paymentStatus.split(',');
            query.paymentStatus = statuses.length > 1 ? { $in: statuses } : filters.paymentStatus;
        }
        return this.billRepository.findBillsPaginated(query, page, limit, sort);
    }
    async getBillById(id, userId) {
        if (!ObjectId.isValid(id))
            throw new AppError("Invalid bill ID format", 400);
        const bill = await this.billRepository.findBillById(id, userId);
        if (!bill)
            throw new AppError("Bill not found or unauthorized", 404);
        return bill;
    }
    async createBill(data, userId) {
        const { date, supplier, amount: amountRaw, vendorInvoiceNo, items, subTotal, discount, freight, roundOff, taxBreakdown, grnId, purchaseOrderId, paymentTerms, dueDate, status: _status, description, paymentMethod = 'cash', paidAmount: paidAmountRaw = 0, bankAccount } = data;
        const paidAmount = Number(paidAmountRaw);
        const amount = Number(amountRaw);
        if (!date || !supplier || !amount) {
            throw new AppError("Date, supplier, and amount are required", 400);
        }
        if (!ObjectId.isValid(supplier)) {
            throw new AppError("Invalid supplier ID format", 400);
        }
        if (bankAccount && !ObjectId.isValid(bankAccount)) {
            throw new AppError("Invalid bank account ID format", 400);
        }
        // Calculate payment status
        let paymentStatus = 'unpaid';
        if (paidAmount >= amount)
            paymentStatus = 'paid';
        else if (paidAmount > 0)
            paymentStatus = 'partial';
        // Validate bank payment
        if (paymentMethod === 'bank_transfer' && paidAmount > 0) {
            if (!bankAccount)
                throw new AppError("Bank account is required for bank transfer", 400);
            const bankAcc = await this.billRepository.findBankAccount(bankAccount, userId);
            if (!bankAcc)
                throw new AppError("Bank account not found", 400);
            if (bankAcc.currentBalance < paidAmount) {
                throw new AppError(`Insufficient balance. Available: ₹${bankAcc.currentBalance}`, 400);
            }
        }
        const billNo = await this.billRepository.generateBillNo(userId);
        const bill = await this.billRepository.createBill({
            billNo, vendorInvoiceNo, date, supplier, amount,
            items: items || [], subTotal: subTotal || 0, discount: discount || 0,
            freight: freight || 0, roundOff: roundOff || 0,
            taxBreakdown: taxBreakdown || { cgst: 0, sgst: 0, igst: 0, other: 0 },
            grnId, purchaseOrderId,
            dueDate: dueDate || undefined, paymentTerms,
            status: paymentStatus === 'paid' ? 'paid' : (_status || 'unpaid'),
            description, paymentMethod, paidAmount,
            bankAccount: (bankAccount && ObjectId.isValid(bankAccount)) ? bankAccount : undefined,
            paymentStatus, createdBy: userId
        });
        // Handle bank payment side effects
        if (paymentMethod === 'bank_transfer' && paidAmount > 0) {
            const cashbankTxn = await this.billRepository.createCashbankTransaction({
                type: 'out', amount: paidAmount, fromAccount: bankAccount,
                toAccount: 'purchase', description: `Payment for bill ${billNo}`,
                date: new Date(), userId,
            });
            await this.billRepository.updateBankBalance(bankAccount, userId, -paidAmount, cashbankTxn._id);
            info(`Bank payment for bill ${billNo}: -₹${paidAmount} from account ${bankAccount}`);
        }
        // Return with populated supplier
        return this.billRepository.findBillById(bill._id.toString(), userId);
    }
    async updateBill(id, userId, updates) {
        if (!ObjectId.isValid(id))
            throw new AppError("Invalid bill ID format", 400);
        const existing = await this.billRepository.findRawBill(id, userId);
        if (!existing)
            throw new AppError("Bill not found or unauthorized", 404);
        const result = await this.billRepository.updateBill(id, userId, updates);
        return result;
    }
    async deleteBill(id, userId) {
        if (!ObjectId.isValid(id))
            throw new AppError("Invalid bill ID format", 400);
        const existing = await this.billRepository.findRawBill(id, userId);
        if (!existing)
            throw new AppError("Bill not found or unauthorized", 404);
        await this.billRepository.deleteBill(id, userId);
    }
    async updateBillPayment(id, userId, paymentData) {
        const { paymentMethod, bankAccount } = paymentData;
        const paidAmount = Number(paymentData.paidAmount);
        if (isNaN(paidAmount) || paidAmount <= 0) {
            throw new AppError("Valid payment amount required", 400);
        }
        if (!ObjectId.isValid(id))
            throw new AppError("Invalid bill ID format", 400);
        const bill = await this.billRepository.findRawBill(id, userId);
        if (!bill)
            throw new AppError("Bill not found", 404);
        const newPaidAmount = bill.paidAmount + paidAmount;
        if (newPaidAmount > bill.amount) {
            throw new AppError(`Payment amount exceeds bill total. Remaining: ₹${bill.amount - bill.paidAmount}`, 400);
        }
        let paymentStatus = 'unpaid';
        let billStatus = 'unpaid';
        if (newPaidAmount >= bill.amount) {
            paymentStatus = 'paid';
            billStatus = 'paid';
        }
        else if (newPaidAmount > 0) {
            paymentStatus = 'partial';
            billStatus = 'unpaid';
        }
        // Handle bank transfer
        if (paymentMethod === 'bank_transfer') {
            if (!bankAccount)
                throw new AppError("Bank account is required for bank transfer", 400);
            const bankAcc = await this.billRepository.findBankAccount(bankAccount, userId);
            if (!bankAcc)
                throw new AppError("Bank account not found", 400);
            if (bankAcc.currentBalance < paidAmount) {
                throw new AppError(`Insufficient balance. Available: ₹${bankAcc.currentBalance}`, 400);
            }
            const cashbankTxn = await this.billRepository.createCashbankTransaction({
                type: 'out', amount: paidAmount, fromAccount: bankAccount,
                toAccount: 'purchase', description: `Payment for bill ${bill.billNo}`,
                date: new Date(), userId,
            });
            await this.billRepository.updateBankBalance(bankAccount, userId, -paidAmount, cashbankTxn._id);
            info(`Bank payment for bill ${bill.billNo}: -₹${paidAmount}`);
        }
        else if (paymentMethod === 'cash') {
            await this.billRepository.createCashbankTransaction({
                type: 'out', amount: paidAmount, fromAccount: 'cash',
                toAccount: 'purchase', description: `Cash payment for bill ${bill.billNo}`,
                userId,
            });
            info(`Cash payment for bill ${bill.billNo}: -₹${paidAmount}`);
        }
        // Update the bill
        const updatedBill = await this.billRepository.updateBillFields(id, userId, {
            paidAmount: newPaidAmount,
            paymentStatus,
            status: billStatus,
            paymentMethod,
            bankAccount: (bankAccount && ObjectId.isValid(bankAccount)) ? bankAccount : undefined,
        });
        return updatedBill;
    }
};
BillService = __decorate([
    injectable(),
    __param(0, inject(BillRepository)),
    __metadata("design:paramtypes", [BillRepository])
], BillService);
export { BillService };
