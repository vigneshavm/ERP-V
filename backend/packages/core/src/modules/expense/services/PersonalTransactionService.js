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
import { PersonalTransactionRepository } from '@smarterp/shared/repositories/PersonalTransactionRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { info } from '@smarterp/shared/config/logger.js';
import BankAccount from '@smarterp/core/modules/finance/models/BankAccount.js';
import { invalidateUserCache } from '@smarterp/shared/config/cache.js';
let PersonalTransactionService = class PersonalTransactionService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async invalidateCache(userId) {
        await invalidateUserCache(userId, '/api/personal-transactions*');
        await invalidateUserCache(userId, '/api/expense*');
    }
    async createTransaction(data, userId) {
        const { type, amount, category, account, date, description, isRecurring, receipt } = data;
        if (!type || !amount || !category || !account) {
            throw new AppError("Type, amount, category, and account are required", 400);
        }
        // Validate account and update balance
        const bankAccount = await BankAccount.findOne({ _id: account, userId });
        if (!bankAccount) {
            throw new AppError("Account not found", 404);
        }
        const transaction = await this.repository.create({
            ...data,
            createdBy: userId,
            tenantId: bankAccount.tenantId
        });
        // Update Balance: Income adds, Expense subtracts
        const balanceChange = type === 'income' ? amount : -amount;
        await BankAccount.updateOne({ _id: account, userId }, { $inc: { currentBalance: balanceChange } });
        info(`Personal transaction created: ${type} of ₹${amount} for user ${userId}`);
        await this.invalidateCache(userId);
        return transaction;
    }
    async getAllTransactions(userId) {
        return this.repository.findAll(userId);
    }
    async updateTransaction(id, userId, updateData) {
        const transaction = await this.repository.findById(id, userId);
        if (!transaction) {
            throw new AppError("Transaction not found", 404);
        }
        // If amount or type changes, we'd need complex balance reconciliation
        // For simplicity in this first version, we'll just allow basic updates
        // or re-calculate balance if amount changed.
        if (updateData.amount !== undefined && updateData.amount !== transaction.amount) {
            const oldImpact = transaction.type === 'income' ? transaction.amount : -transaction.amount;
            const newImpact = (updateData.type || transaction.type) === 'income' ? updateData.amount : -updateData.amount;
            const diff = newImpact - oldImpact;
            await BankAccount.updateOne({ _id: transaction.account, userId }, { $inc: { currentBalance: diff } });
        }
        const updated = await this.repository.update(id, userId, updateData);
        if (!updated)
            throw new AppError("Update failed", 500);
        await this.invalidateCache(userId);
        return updated;
    }
    async deleteTransaction(id, userId) {
        const transaction = await this.repository.findById(id, userId);
        if (!transaction)
            throw new AppError("Transaction not found", 404);
        // Reverse balance impact
        const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
        await BankAccount.updateOne({ _id: transaction.account, userId }, { $inc: { currentBalance: balanceChange } });
        await this.repository.delete(id, userId);
        await this.invalidateCache(userId);
    }
};
PersonalTransactionService = __decorate([
    injectable(),
    __param(0, inject(PersonalTransactionRepository)),
    __metadata("design:paramtypes", [PersonalTransactionRepository])
], PersonalTransactionService);
export { PersonalTransactionService };
