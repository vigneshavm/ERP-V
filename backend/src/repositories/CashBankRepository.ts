import { injectable, singleton } from "tsyringe";
import BankAccount from "../modules/finance/models/BankAccount.js";
import CashbankTransaction from "../modules/finance/models/CashbankTransaction.js";
import { IBankAccount } from "../interfaces/IBankAccount.js";
import { ICashbankTransaction } from "../interfaces/ICashbankTransaction.js";
import { ICheque } from "../interfaces/ICheque.js";
import Cheque from "../modules/finance/models/Cheque.js";
import crypto from "crypto";
import mongoose from "mongoose";

@injectable()
@singleton()
export class CashBankRepository {
    // Cryptography Helpers
    public encryptAccountNumber(accountNumber: string): string {
        const algorithm = "aes-256-cbc";
        const secret = process.env.ENCRYPTION_KEY || process.env.COOKIE_SECRET || "default_fallback_secret_must_be_long";
        const key = crypto.scryptSync(secret, "salt", 32);
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(accountNumber, "utf8", "hex");
        encrypted += cipher.final("hex");

        return iv.toString("hex") + ":" + encrypted;
    }

    public decryptAccountNumber(encryptedAccountNumber: string): string {
        const parts = encryptedAccountNumber.split(":");
        if (parts.length < 2) return encryptedAccountNumber;

        const iv = Buffer.from(parts[0], "hex");
        const encrypted = parts[1];
        const algorithm = "aes-256-cbc";
        const secret = process.env.ENCRYPTION_KEY || process.env.COOKIE_SECRET || "default_fallback_secret_must_be_long";
        const key = crypto.scryptSync(secret, "salt", 32);

        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }

    // Bank Account Methods
    async createAccount(data: Partial<IBankAccount>): Promise<IBankAccount> {
        if (data.accountNumber) {
            data.accountNumber = this.encryptAccountNumber(data.accountNumber);
        }
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
        const match = accounts.find((acc: any) => this.decryptAccountNumber(acc.accountNumber) === accountNumber);
        return match || null;
    }

    async getAccounts(userId: string): Promise<IBankAccount[]> {
        return BankAccount.find({ userId });
    }

    async updateAccount(id: string, userId: string, updates: Partial<IBankAccount>): Promise<IBankAccount | null> {
        if (updates.accountNumber) {
            updates.accountNumber = this.encryptAccountNumber(updates.accountNumber);
        }
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

    // Cheque Methods
    async queryCheques(query: any, sort: any = { date: 1 }): Promise<ICheque[]> {
        return Cheque.find(query).sort(sort);
    }

    async findChequeById(id: string, userId: string): Promise<ICheque | null> {
        return Cheque.findOne({ _id: id, userId });
    }

    async createCheque(data: Partial<ICheque>): Promise<ICheque> {
        return Cheque.create(data);
    }

    async updateCheque(id: string, userId: string, updates: Partial<ICheque>): Promise<ICheque | null> {
        return Cheque.findOneAndUpdate(
            { _id: id, userId },
            updates,
            { new: true }
        );
    }
}
