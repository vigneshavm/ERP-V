import { injectable, singleton } from "tsyringe";
import { ObjectId, ClientSession } from "mongodb";
import { mongoClient } from '@smarterp/shared/config/database.js';

const getDb = () => {
    if (!mongoClient) throw new Error("MongoDB Client not initialized");
    return mongoClient.db();
};

@injectable()
@singleton()
export class LoanRepository {
    private get loans() { return getDb().collection('loans'); }
    private get loanPayments() { return getDb().collection('loanpayments'); }
    private get bankAccounts() { return getDb().collection('bankaccounts'); }
    private get cashbankTransactions() { return getDb().collection('cashbanktransactions'); }

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

    // Loan CRUD
    async createLoan(data: any, session?: ClientSession): Promise<any> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.tenantId && typeof data.tenantId === 'string') data.tenantId = new ObjectId(data.tenantId);
        if (data.userId && typeof data.userId === 'string') data.userId = new ObjectId(data.userId);
        data.status = data.status || 'active';

        const result = await this.loans.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }

    async findLoans(tenantId: string, session?: ClientSession): Promise<any[]> {
        return this.loans.find(
            { tenantId: new ObjectId(tenantId) },
            { session }
        ).sort({ createdAt: -1 }).toArray();
    }

    async findLoanById(id: string, tenantId: string, session?: ClientSession): Promise<any | null> {
        return this.loans.findOne(
            { _id: new ObjectId(id), tenantId: new ObjectId(tenantId) },
            { session }
        );
    }

    async updateLoan(id: string, tenantId: string, updates: any, session?: ClientSession): Promise<any | null> {
        updates.updatedAt = new Date();
        return this.loans.findOneAndUpdate(
            { _id: new ObjectId(id), tenantId: new ObjectId(tenantId) },
            { $set: updates },
            { returnDocument: 'after', session }
        );
    }

    // LoanPayment CRUD
    async findLoanPayments(loanId: string, tenantId: string, session?: ClientSession): Promise<any[]> {
        const payments = await this.loanPayments.find(
            { loanId: new ObjectId(loanId), tenantId: new ObjectId(tenantId) },
            { session }
        ).sort({ paymentDate: -1 }).toArray();

        // Manually populate bankAccountId
        const bankIds = [...new Set(payments.map((p: any) => p.bankAccountId?.toString()).filter(Boolean))] as string[];
        const bankDocs = bankIds.length > 0
            ? await this.bankAccounts.find({ _id: { $in: bankIds.map((id) => new ObjectId(id)) } }, { session, projection: { bankName: 1, accountNumber: 1 } }).toArray()
            : [];
        const bankMap = new Map(bankDocs.map((b: any) => [b._id.toString(), b]));

        return payments.map((p: any) => ({
            ...p,
            bankAccountId: bankMap.get(p.bankAccountId?.toString()) || p.bankAccountId
        }));
    }

    async createLoanPayment(data: any, session?: ClientSession): Promise<any> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.tenantId && typeof data.tenantId === 'string') data.tenantId = new ObjectId(data.tenantId);
        if (data.userId && typeof data.userId === 'string') data.userId = new ObjectId(data.userId);
        if (data.loanId && typeof data.loanId === 'string') data.loanId = new ObjectId(data.loanId);
        if (data.bankAccountId && typeof data.bankAccountId === 'string') data.bankAccountId = new ObjectId(data.bankAccountId);

        const result = await this.loanPayments.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }

    // Bank Account helpers
    async findBankAccount(id: string, tenantId: string, session?: ClientSession): Promise<any | null> {
        return this.bankAccounts.findOne(
            { _id: new ObjectId(id), tenantId: new ObjectId(tenantId) },
            { session }
        );
    }

    async updateBankAccountBalance(id: string, amount: number, session?: ClientSession): Promise<void> {
        await this.bankAccounts.updateOne(
            { _id: new ObjectId(id) },
            { $inc: { currentBalance: amount }, $set: { updatedAt: new Date() } },
            { session }
        );
    }

    // CashBank Transaction helper
    async createCashbankTransaction(data: any, session?: ClientSession): Promise<any> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.userId && typeof data.userId === 'string') data.userId = new ObjectId(data.userId);
        const result = await this.cashbankTransactions.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }
}
