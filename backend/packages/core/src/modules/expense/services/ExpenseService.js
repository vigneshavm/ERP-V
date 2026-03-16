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
import { ExpenseRepository } from '@smarterp/shared/repositories/ExpenseRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { info } from '@smarterp/shared/config/logger.js';
import BankAccount from '@smarterp/core/modules/finance/models/BankAccount.js';
import CashbankTransaction from '@smarterp/core/modules/finance/models/CashbankTransaction.js';
import { invalidateUserCache } from '@smarterp/shared/config/cache.js';
let ExpenseService = class ExpenseService {
    expenseRepository;
    constructor(expenseRepository) {
        this.expenseRepository = expenseRepository;
    }
    async invalidateExpenseCache(userId) {
        await invalidateUserCache(userId, '/api/expense*');
        await invalidateUserCache(userId, '/api/reports*');
        await invalidateUserCache(userId, '/api/finance*');
    }
    async createExpense(expenseData, userId) {
        const { expenseNo, date, category, amount, paymentMethod, description, receipt: _receipt, bankAccount } = expenseData;
        if (!expenseNo || !date || !category || !amount) {
            throw new AppError("Expense number, date, category, and amount are required", 400);
        }
        const existingExpense = await this.expenseRepository.findByExpenseNo(expenseNo, userId);
        if (existingExpense) {
            throw new AppError("Expense number already exists", 400);
        }
        // Validate bank payment
        if (paymentMethod === 'bank_transfer' && bankAccount) {
            const bankAcc = await BankAccount.findOne({ _id: bankAccount, userId });
            if (!bankAcc) {
                throw new AppError("Bank account not found", 400);
            }
            if (bankAcc.currentBalance < amount) {
                throw new AppError(`Insufficient balance. Available: ₹${bankAcc.currentBalance}`, 400);
            }
        }
        // Create expense
        const expense = await this.expenseRepository.create({
            ...expenseData,
            paymentMethod: paymentMethod || 'cash',
            bankAccount: bankAccount || null,
            createdBy: userId
        });
        // Handle Bank/Cash Transaction
        if (paymentMethod === 'bank_transfer' && bankAccount) {
            const cashbankTxn = await CashbankTransaction.create({
                type: 'out',
                amount,
                fromAccount: bankAccount,
                toAccount: 'expense',
                description: `Expense: ${category} - ${description || expenseNo}`,
                date: new Date(),
                userId,
            });
            await BankAccount.updateOne({ _id: bankAccount, userId }, {
                $inc: { currentBalance: -amount },
                $push: { transactions: cashbankTxn._id }
            });
            info(`Bank payment for expense ${expenseNo}: -₹${amount} from account ${bankAccount}`);
        }
        else if (paymentMethod === 'cash') {
            await CashbankTransaction.create({
                type: 'out',
                amount,
                fromAccount: 'cash',
                toAccount: 'expense',
                description: `Cash expense: ${category} - ${description || expenseNo}`,
                date: new Date(),
                userId,
            });
            info(`Cash payment for expense ${expenseNo}: -₹${amount}`);
        }
        await this.invalidateExpenseCache(userId);
        return expense;
    }
    async getAllExpenses(userId) {
        return this.expenseRepository.findAll(userId);
    }
    async getExpenseById(expenseId, userId) {
        const expense = await this.expenseRepository.findById(expenseId, userId);
        if (!expense) {
            throw new AppError("Expense not found or unauthorized", 404);
        }
        return expense;
    }
    async updateExpense(expenseId, userId, updateData) {
        const expense = await this.expenseRepository.findById(expenseId, userId);
        if (!expense) {
            throw new AppError("Expense not found or unauthorized", 404);
        }
        if (updateData.expenseNo && updateData.expenseNo !== expense.expenseNo) {
            const existingExpense = await this.expenseRepository.findByExpenseNoExcludingId(updateData.expenseNo, userId, expenseId);
            if (existingExpense) {
                throw new AppError("Expense number already exists", 400);
            }
        }
        // Sanitize bankAccount if empty
        if (updateData.bankAccount === "") {
            updateData.bankAccount = undefined;
        }
        const updatedExpense = await this.expenseRepository.update(expenseId, userId, updateData);
        if (!updatedExpense)
            throw new AppError("Update failed", 500);
        await this.invalidateExpenseCache(userId);
        return updatedExpense;
    }
    async deleteExpense(expenseId, userId) {
        const expense = await this.expenseRepository.findById(expenseId, userId);
        if (!expense) {
            throw new AppError("Expense not found or unauthorized", 404);
        }
        await this.expenseRepository.delete(expenseId, userId);
        info(`Expense deleted: ${expense.expenseNo}`);
        await this.invalidateExpenseCache(userId);
    }
};
ExpenseService = __decorate([
    injectable(),
    __param(0, inject(ExpenseRepository)),
    __metadata("design:paramtypes", [ExpenseRepository])
], ExpenseService);
export { ExpenseService };
