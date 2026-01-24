import { injectable, singleton } from "tsyringe";
import BankAccount from "../models/BankAccount.js";
import CashbankTransaction from "../models/CashbankTransaction.js";
import { IBankAccount } from "../interfaces/IBankAccount.js";
import { ICashbankTransaction } from "../interfaces/ICashbankTransaction.js";
import mongoose from "mongoose";

@injectable()
@singleton()
export class CashBankRepository {
    // Bank Account Methods
    async createAccount(data: Partial<IBankAccount>): Promise<IBankAccount> {
        return BankAccount.create(data);
    }

    async findAccountById(id: string, userId: string): Promise<IBankAccount | null> {
        return BankAccount.findOne({ _id: id, userId });
    }

    async findAccountByNumber(accountNumber: string, userId: string): Promise<IBankAccount | null> {
        // Since account number is encrypted, we can't search directly unless we replicate encryption logic here
        // or search all and decrypt. For strict searching, we'd need deterministic encryption or a hash index.
        // Assuming unique constraint logic handled at application level or schema level if possible.
        // Given current encryption is randomized (IV), direct search is impossible without fetching all.
        // Optimization: Fetch all for user and filter in memory (assuming low count of accounts).
        const accounts = await BankAccount.find({ userId });
        const match = accounts.find(acc => acc.getDecryptedAccountNumber() === accountNumber);
        return match || null;
    }

    async getAccounts(userId: string): Promise<IBankAccount[]> {
        return BankAccount.find({ userId });
    }

    async updateAccount(id: string, userId: string, updates: Partial<IBankAccount>): Promise<IBankAccount | null> {
        return BankAccount.findOneAndUpdate(
            { _id: id, userId },
            updates,
            { new: true }
        );
    }

    async updateBalance(id: string, amount: number): Promise<void> {
        await BankAccount.findByIdAndUpdate(id, { $inc: { currentBalance: amount } });
    }

    async deleteAccount(id: string, userId: string): Promise<IBankAccount | null> {
        return BankAccount.findOneAndDelete({ _id: id, userId });
    }

    // Transaction Methods
    async createTransaction(data: Partial<ICashbankTransaction>): Promise<ICashbankTransaction> {
        return CashbankTransaction.create(data);
    }

    async findTransactionById(id: string, userId: string): Promise<ICashbankTransaction | null> {
        return CashbankTransaction.findOne({ _id: id, userId });
    }

    async getTransactions(userId: string, accountId: string): Promise<ICashbankTransaction[]> {
        return CashbankTransaction.find({
            userId,
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        }).sort({ date: -1 });
    }

    async updateTransaction(id: string, userId: string, updates: Partial<ICashbankTransaction>): Promise<ICashbankTransaction | null> {
        return CashbankTransaction.findOneAndUpdate(
            { _id: id, userId },
            updates,
            { new: true }
        );
    }

    async updateManyTransactions(ids: string[], userId: string, updates: Partial<ICashbankTransaction>): Promise<any> {
        return CashbankTransaction.updateMany(
            { _id: { $in: ids }, userId },
            { $set: updates }
        );
    }

    async countTransactions(accountId: string): Promise<number> {
        return CashbankTransaction.countDocuments({
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        });
    }

    // Aggregations
    async getCashBalance(userId: string): Promise<number> {
        const cashIn = await CashbankTransaction.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), toAccount: 'cash' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const cashOut = await CashbankTransaction.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), fromAccount: 'cash' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        return (cashIn[0]?.total || 0) - (cashOut[0]?.total || 0);
    }

    async queryTransactions(query: any, sort: any = { date: 1, createdAt: 1 }): Promise<ICashbankTransaction[]> {
        return CashbankTransaction.find(query).sort(sort).lean() as unknown as ICashbankTransaction[];
    }
}
