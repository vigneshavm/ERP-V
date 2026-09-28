import { injectable, singleton } from "tsyringe";
import mongoose, { ClientSession } from "mongoose";
import BankAccount from "../models/BankAccount.js";
import CashbankTransaction from "../models/CashbankTransaction.js";
import { IBankAccount } from "../../../interfaces/IBankAccount.js";
import { ICashbankTransaction } from "../../../interfaces/ICashbankTransaction.js";

@injectable()
@singleton()
export class CashBankRepository {
    // Bank Account Methods
    async createAccount(data: Partial<IBankAccount>, tenantId: string, session?: ClientSession): Promise<IBankAccount> {
        const payload = { ...data, tenantId };
        if (session) {
            return (await BankAccount.create([payload], { session }))[0];
        }
        return BankAccount.create(payload);
    }

    async findAccountById(id: string, tenantId: string, session?: ClientSession): Promise<IBankAccount | null> {
        const query = BankAccount.findOne({ _id: id, tenantId });
        if (session) {
            return query.session(session);
        }
        return query;
    }

    async findAccountByNumber(accountNumber: string, tenantId: string): Promise<IBankAccount | null> {
        const accounts = await BankAccount.find({ tenantId });
        const match = accounts.find((acc: any) => acc.getDecryptedAccountNumber() === accountNumber);
        return match || null;
    }

    async getAccounts(tenantId: string): Promise<IBankAccount[]> {
        return BankAccount.find({ tenantId });
    }

    async updateAccount(id: string, tenantId: string, updates: Partial<IBankAccount>, session?: ClientSession): Promise<IBankAccount | null> {
        const query = BankAccount.findOneAndUpdate(
            { _id: id, tenantId },
            updates,
            { new: true }
        );
        if (session) {
            return query.session(session);
        }
        return query;
    }

    async updateBalance(id: string, tenantId: string, amount: number, session?: ClientSession): Promise<void> {
        const query = BankAccount.updateOne(
            { _id: id, tenantId },
            { $inc: { currentBalance: amount } }
        );
        if (session) {
            await query.session(session);
        } else {
            await query;
        }
    }

    async deleteAccount(id: string, tenantId: string): Promise<IBankAccount | null> {
        return BankAccount.findOneAndDelete({ _id: id, tenantId });
    }

    // Transaction Methods
    async createTransaction(data: Partial<ICashbankTransaction>, tenantId: string, session?: ClientSession): Promise<ICashbankTransaction> {
        const payload = { ...data, tenantId };
        if (session) {
            return (await CashbankTransaction.create([payload], { session }))[0];
        }
        return CashbankTransaction.create(payload);
    }

    async findTransactionById(id: string, tenantId: string): Promise<ICashbankTransaction | null> {
        return CashbankTransaction.findOne({ _id: id, tenantId });
    }

    async getTransactions(tenantId: string, accountId?: string): Promise<ICashbankTransaction[]> {
        const query: any = { tenantId };
        if (accountId) {
            query.$or = [{ fromAccount: accountId }, { toAccount: accountId }];
        }
        return CashbankTransaction.find(query).sort({ date: -1 });
    }

    async updateTransaction(id: string, tenantId: string, updates: Partial<ICashbankTransaction>): Promise<ICashbankTransaction | null> {
        return CashbankTransaction.findOneAndUpdate(
            { _id: id, tenantId },
            updates,
            { new: true }
        );
    }

    async updateManyTransactions(ids: string[], tenantId: string, updates: Partial<ICashbankTransaction>): Promise<any> {
        return CashbankTransaction.updateMany(
            { _id: { $in: ids }, tenantId },
            { $set: updates }
        );
    }

    async countTransactions(accountId: string, tenantId: string): Promise<number> {
        return CashbankTransaction.countDocuments({
            tenantId,
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        });
    }

    // Aggregations
    async getCashBalance(tenantId: string): Promise<number> {
        const tenantObjectId = new mongoose.Types.ObjectId(tenantId);
        const cashIn = await CashbankTransaction.aggregate([
            { $match: { tenantId: tenantObjectId, toAccount: 'cash' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const cashOut = await CashbankTransaction.aggregate([
            { $match: { tenantId: tenantObjectId, fromAccount: 'cash' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        return (cashIn[0]?.total || 0) - (cashOut[0]?.total || 0);
    }

    async queryTransactions(tenantId: string, query: any, sort: any = { date: 1, createdAt: 1 }): Promise<ICashbankTransaction[]> {
        const scopedQuery = { ...query, tenantId };
        return CashbankTransaction.find(scopedQuery).sort(sort).lean() as unknown as ICashbankTransaction[];
    }
}
