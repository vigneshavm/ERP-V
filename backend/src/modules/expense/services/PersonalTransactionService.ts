import { injectable, inject } from "tsyringe";
import { PersonalTransactionRepository } from "../../../repositories/PersonalTransactionRepository.js";
import { IPersonalTransaction } from "../../../interfaces/IPersonalTransaction.js";
import { AppError } from "../../../utils/AppError.js";
import { info } from "../../../config/logger.js";
import BankAccount from "../../finance/models/BankAccount.js";
import { invalidateUserCache } from "../../../config/cache.js";

@injectable()
export class PersonalTransactionService {
    constructor(
        @inject(PersonalTransactionRepository) private repository: PersonalTransactionRepository
    ) { }

    private async invalidateCache(userId: string): Promise<void> {
        await invalidateUserCache(userId, '/api/personal-transactions*');
        await invalidateUserCache(userId, '/api/expense*');
    }

    async createTransaction(data: any, userId: string): Promise<IPersonalTransaction> {
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
        
        await BankAccount.updateOne(
            { _id: account, userId },
            { $inc: { currentBalance: balanceChange } }
        );

        info(`Personal transaction created: ${type} of ₹${amount} for user ${userId}`);
        await this.invalidateCache(userId);

        return transaction;
    }

    async getAllTransactions(userId: string): Promise<IPersonalTransaction[]> {
        return this.repository.findAll(userId);
    }

    async updateTransaction(id: string, userId: string, updateData: any): Promise<IPersonalTransaction> {
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

            await BankAccount.updateOne(
                { _id: transaction.account, userId },
                { $inc: { currentBalance: diff } }
            );
        }

        const updated = await this.repository.update(id, userId, updateData);
        if (!updated) throw new AppError("Update failed", 500);

        await this.invalidateCache(userId);
        return updated;
    }

    async deleteTransaction(id: string, userId: string): Promise<void> {
        const transaction = await this.repository.findById(id, userId);
        if (!transaction) throw new AppError("Transaction not found", 404);

        // Reverse balance impact
        const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount;
        await BankAccount.updateOne(
            { _id: transaction.account, userId },
            { $inc: { currentBalance: balanceChange } }
        );

        await this.repository.delete(id, userId);
        await this.invalidateCache(userId);
    }
}
