import { singleton } from "tsyringe";
import { BaseRepository } from "@smarterp/shared/repositories/BaseRepository.js";
import BankAccount, { IBankAccount } from "../models/BankAccount.js";
import { ClientSession, ObjectId } from "mongodb";
import crypto from "crypto";

@singleton()
export class CashBankRepository extends BaseRepository<IBankAccount> {
    constructor() {
        super(BankAccount);
    }

    // Cryptography Helpers (Standardized)
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
        if (!encryptedAccountNumber) return encryptedAccountNumber;
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
    async createAccount(data: Partial<IBankAccount>, session?: ClientSession): Promise<IBankAccount> {
        if (data.accountNumber) {
            data.accountNumber = this.encryptAccountNumber(data.accountNumber);
        }
        return this.create(data as any, session);
    }

    async findAccountById(id: string, userId: string, session?: ClientSession): Promise<IBankAccount | null> {
        return this.model.findOne({ _id: id, userId: userId }).session(session || null).exec();
    }

    async findAccountByNumber(accountNumber: string, userId: string, session?: ClientSession): Promise<IBankAccount | null> {
        // Since we encrypt, we need to fetch all and decrypt, or use a deterministic hash for lookup.
        // For now, keeping the current logic of fetching all user accounts.
        const allAccounts = await this.model.find({ userId }).session(session || null).exec();
        const match = allAccounts.find((acc: any) => this.decryptAccountNumber(acc.accountNumber) === accountNumber);
        return match || null;
    }

    async getAccounts(userId: string, session?: ClientSession): Promise<IBankAccount[]> {
        return this.model.find({ userId }).session(session || null).exec();
    }

    async updateAccount(id: string, userId: string, updates: Partial<IBankAccount>, session?: ClientSession): Promise<IBankAccount | null> {
        if (updates.accountNumber) {
            updates.accountNumber = this.encryptAccountNumber(updates.accountNumber);
        }
        return this.model.findOneAndUpdate(
            { _id: id, userId: userId },
            { $set: updates },
            { new: true, session }
        ).exec();
    }

    async updateBalance(id: string, amount: number, session?: ClientSession): Promise<void> {
        await this.model.updateOne(
            { _id: id },
            { $inc: { currentBalance: amount }, $set: { updatedAt: new Date() } },
            { session }
        );
    }

    // Transaction Methods
    private get TransactionModel() { return this.model.db.model('CashbankTransaction'); }
    private get ChequeModel() { return this.model.db.model('Cheque'); }

    async createTransaction(data: any, session?: ClientSession): Promise<any> {
        const txn = new this.TransactionModel(data);
        return txn.save({ session });
    }

    async findTransactionById(id: string, userId: string, session?: ClientSession): Promise<any | null> {
        return this.TransactionModel.findOne({ _id: id, userId: userId }).session(session || null).exec();
    }

    async getTransactions(userId: string, accountId: string, session?: ClientSession): Promise<any[]> {
        return this.TransactionModel.find({
            userId,
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        }).sort({ date: -1 }).session(session || null).exec();
    }

    async getLedgerTransactions(accountId: string, userId: string, startDate?: Date, endDate?: Date, reconciled?: boolean, session?: ClientSession): Promise<any[]> {
        const query: any = {
            userId,
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }
        if (reconciled !== undefined) query.reconciled = reconciled;

        return this.TransactionModel.find(query).sort({ date: 1, createdAt: 1 }).session(session || null).exec();
    }

    async updateTransaction(id: string, userId: string, updates: any, session?: ClientSession): Promise<any | null> {
        return this.TransactionModel.findOneAndUpdate(
            { _id: id, userId: userId },
            { $set: updates },
            { new: true, session }
        ).exec();
    }

    async updateManyTransactions(ids: string[], userId: string, updates: any, session?: ClientSession): Promise<any> {
        return this.TransactionModel.updateMany(
            { _id: { $in: ids }, userId },
            { $set: updates },
            { session }
        ).exec();
    }

    async countTransactions(accountId: string, session?: ClientSession): Promise<number> {
        return this.TransactionModel.countDocuments({
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        }).session(session || null).exec();
    }

    async deleteAccount(id: string, userId: string, session?: ClientSession): Promise<IBankAccount | null> {
        return this.model.findOneAndDelete({ _id: id, userId: userId }).session(session || null).exec();
    }

    async getPriorTransactionsSum(accountId: string, userId: string, beforeDate: Date, session?: ClientSession): Promise<number> {
        const txns = await this.TransactionModel.find({
            userId,
            date: { $lt: beforeDate },
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        }).session(session || null).exec();

        return txns.reduce((sum: number, t: any) => {
            const isMoneyIn = t.toAccount.toString() === accountId;
            return sum + (isMoneyIn ? t.amount : -t.amount);
        }, 0);
    }

    async getPendingIssuedCheques(accountId: string, userId: string, upToDate?: Date, session?: ClientSession): Promise<any[]> {
        const query: any = {
            accountId,
            type: 'ISSUED',
            status: 'PENDING',
            userId
        };
        if (upToDate) query.date = { $lte: upToDate };
        return this.ChequeModel.find(query).sort({ date: 1 }).session(session || null).exec();
    }

    async getDailyCashTransactions(userId: string, start: Date, end: Date, type: 'in' | 'out', session?: ClientSession): Promise<any[]> {
        return this.TransactionModel.find({
            userId,
            type,
            [type === 'in' ? 'toAccount' : 'fromAccount']: 'cash',
            date: { $gte: start, $lte: end }
        }).session(session || null).exec();
    }

    async getDailyCheques(userId: string, start: Date, end: Date, status?: string, session?: ClientSession): Promise<any[]> {
        const query: any = {
            userId,
            date: { $gte: start, $lte: end }
        };
        if (status) query.status = status;
        return this.ChequeModel.find(query).sort({ date: 1 }).session(session || null).exec();
    }

    async queryTransactions(query: any, sortQuery: any = { date: 1, createdAt: 1 }, session?: ClientSession): Promise<any[]> {
        return this.TransactionModel.find(query).sort(sortQuery).session(session || null).exec();
    }

    async getCashBalance(userId: string, session?: ClientSession): Promise<number> {
        const cashIn = await this.TransactionModel.aggregate([
            { $match: { userId: new ObjectId(userId), toAccount: 'cash' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ], { session } as any).exec();
        const cashOut = await this.TransactionModel.aggregate([
            { $match: { userId: new ObjectId(userId), fromAccount: 'cash' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ], { session } as any).exec();
        return (cashIn[0]?.total || 0) - (cashOut[0]?.total || 0);
    }

    // Cheque Methods
    async findChequeById(id: string, userId: string, session?: ClientSession): Promise<any | null> {
        return this.ChequeModel.findOne({ _id: id, userId: userId }).session(session || null).exec();
    }

    async createCheque(data: any, session?: ClientSession): Promise<any> {
        const cheque = new this.ChequeModel(data);
        return cheque.save({ session });
    }

    async updateCheque(id: string, userId: string, updates: any, session?: ClientSession): Promise<any | null> {
        return this.ChequeModel.findOneAndUpdate(
            { _id: id, userId: userId },
            { $set: updates },
            { new: true, session }
        ).exec();
    }

    async queryCheques(query: any, sortQuery: any = { date: 1 }, session?: ClientSession): Promise<any[]> {
        if (query.userId && typeof query.userId === 'string') query.userId = new ObjectId(query.userId);
        return this.ChequeModel.find(query).sort(sortQuery).session(session || null).exec();
    }
}
