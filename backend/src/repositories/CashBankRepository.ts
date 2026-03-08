import { injectable, singleton } from "tsyringe";
import { IBankAccount } from "../interfaces/IBankAccount.js";
import { ICashbankTransaction } from "../interfaces/ICashbankTransaction.js";
import { ICheque } from "../interfaces/ICheque.js";
import crypto from "crypto";
import { ObjectId, ClientSession } from "mongodb";
import { mongoClient } from "../config/database.js";

const getDb = () => {
    if (!mongoClient) throw new Error("MongoDB Client not initialized");
    return mongoClient.db();
};

@injectable()
@singleton()
export class CashBankRepository {
    private get accounts() { return getDb().collection('bankaccounts'); }
    private get transactions() { return getDb().collection('cashbanktransactions'); }
    private get cheques() { return getDb().collection('cheques'); }

    // Transaction Management
    public async executeInTransaction<T>(callback: (session: ClientSession) => Promise<T>): Promise<T> {
        if (!mongoClient) throw new Error("MongoDB Client not initialized");
        const session = mongoClient.startSession();
        try {
            let result: any;
            await session.withTransaction(async () => {
                result = await callback(session);
            });
            return result as T;
        } finally {
            await session.endSession();
        }
    }

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
        data.createdAt = new Date();
        data.updatedAt = new Date();

        if (data.tenantId && typeof data.tenantId === 'string') data.tenantId = new ObjectId(data.tenantId);
        if (data.userId && typeof data.userId === 'string') data.userId = new ObjectId(data.userId);

        const result = await this.accounts.insertOne(data as IBankAccount, { session });
        return { ...data, _id: result.insertedId } as IBankAccount;
    }

    async findAccountById(id: string, userId: string, session?: ClientSession): Promise<IBankAccount | null> {
        return this.accounts.findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) }, { session });
    }

    async findAccountByNumber(accountNumber: string, userId: string, session?: ClientSession): Promise<IBankAccount | null> {
        const _userId = new ObjectId(userId);
        const accountsCursor = this.accounts.find({ userId: _userId }, { session });
        const allAccounts = await accountsCursor.toArray();
        const match = allAccounts.find((acc: any) => this.decryptAccountNumber(acc.accountNumber) === accountNumber);
        return match || null;
    }

    async getAccounts(userId: string, session?: ClientSession): Promise<IBankAccount[]> {
        return this.accounts.find({ userId: new ObjectId(userId) }, { session }).toArray();
    }

    async updateAccount(id: string, userId: string, updates: Partial<IBankAccount>, session?: ClientSession): Promise<IBankAccount | null> {
        if (updates.accountNumber) {
            updates.accountNumber = this.encryptAccountNumber(updates.accountNumber);
        }
        updates.updatedAt = new Date();
        const result = await this.accounts.findOneAndUpdate(
            { _id: new ObjectId(id), userId: new ObjectId(userId) },
            { $set: updates },
            { returnDocument: 'after', session }
        );
        return result;
    }

    async updateBalance(id: string, amount: number, session?: ClientSession): Promise<void> {
        await this.accounts.updateOne(
            { _id: new ObjectId(id) },
            { $inc: { currentBalance: amount }, $set: { updatedAt: new Date() } },
            { session }
        );
    }

    async deleteAccount(id: string, userId: string, session?: ClientSession): Promise<IBankAccount | null> {
        const result = await this.accounts.findOneAndDelete({ _id: new ObjectId(id), userId: new ObjectId(userId) }, { session });
        return result;
    }

    // Transaction Methods
    async createTransaction(data: Partial<ICashbankTransaction>, session?: ClientSession): Promise<ICashbankTransaction> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.userId && typeof data.userId === 'string') data.userId = new ObjectId(data.userId) as any;
        if (data.reconciledBy && typeof data.reconciledBy === 'string') data.reconciledBy = new ObjectId(data.reconciledBy) as any;

        const result = await this.transactions.insertOne(data as ICashbankTransaction, { session });
        return { ...data, _id: result.insertedId } as ICashbankTransaction;
    }

    async findTransactionById(id: string, userId: string, session?: ClientSession): Promise<ICashbankTransaction | null> {
        return this.transactions.findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) }, { session });
    }

    async getTransactions(userId: string, accountId: string, session?: ClientSession): Promise<ICashbankTransaction[]> {
        return this.transactions.find({
            userId: new ObjectId(userId),
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        }, { session }).sort({ date: -1 }).toArray();
    }

    async updateTransaction(id: string, userId: string, updates: Partial<ICashbankTransaction>, session?: ClientSession): Promise<ICashbankTransaction | null> {
        updates.updatedAt = new Date();
        const result = await this.transactions.findOneAndUpdate(
            { _id: new ObjectId(id), userId: new ObjectId(userId) },
            { $set: updates },
            { returnDocument: 'after', session }
        );
        return result;
    }

    async updateManyTransactions(ids: string[], userId: string, updates: Partial<ICashbankTransaction>, session?: ClientSession): Promise<any> {
        const objectIds = ids.map(id => new ObjectId(id));
        updates.updatedAt = new Date();
        return this.transactions.updateMany(
            { _id: { $in: objectIds }, userId: new ObjectId(userId) },
            { $set: updates },
            { session }
        );
    }

    async countTransactions(accountId: string, session?: ClientSession): Promise<number> {
        return this.transactions.countDocuments({
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        }, { session });
    }

    // Aggregations
    async getCashBalance(userId: string, session?: ClientSession): Promise<number> {
        const _userId = new ObjectId(userId);
        const cashIn = await this.transactions.aggregate([
            { $match: { userId: _userId, toAccount: 'cash' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ], { session } as any).toArray();
        const cashOut = await this.transactions.aggregate([
            { $match: { userId: _userId, fromAccount: 'cash' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ], { session } as any).toArray();
        return (cashIn[0]?.total || 0) - (cashOut[0]?.total || 0);
    }

    async queryTransactions(query: any, sortQuery: any = { date: 1, createdAt: 1 }, session?: ClientSession): Promise<ICashbankTransaction[]> {
        if (query.userId && typeof query.userId === 'string') query.userId = new ObjectId(query.userId);
        return this.transactions.find(query, { session }).sort(sortQuery).toArray();
    }

    // Cheque Methods
    async queryCheques(query: any, sortQuery: any = { date: 1 }, session?: ClientSession): Promise<ICheque[]> {
        if (query.userId && typeof query.userId === 'string') query.userId = new ObjectId(query.userId);
        return this.cheques.find(query, { session }).sort(sortQuery).toArray();
    }

    async findChequeById(id: string, userId: string, session?: ClientSession): Promise<ICheque | null> {
        return this.cheques.findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) }, { session });
    }

    async createCheque(data: Partial<ICheque>, session?: ClientSession): Promise<ICheque> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.tenantId && typeof data.tenantId === 'string') data.tenantId = new ObjectId(data.tenantId);
        if (data.userId && typeof data.userId === 'string') data.userId = new ObjectId(data.userId);

        const result = await this.cheques.insertOne(data as ICheque, { session });
        return { ...data, _id: result.insertedId } as ICheque;
    }

    async updateCheque(id: string, userId: string, updates: Partial<ICheque>, session?: ClientSession): Promise<ICheque | null> {
        updates.updatedAt = new Date();
        const result = await this.cheques.findOneAndUpdate(
            { _id: new ObjectId(id), userId: new ObjectId(userId) },
            { $set: updates },
            { returnDocument: 'after', session }
        );
        return result;
    }
}
