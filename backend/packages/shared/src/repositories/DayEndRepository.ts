import { injectable, singleton } from "tsyringe";
import { ObjectId, ClientSession } from "mongodb";
import { mongoClient } from '@smarterp/shared/config/database.js';

const getDb = () => {
    if (!mongoClient) throw new Error("MongoDB Client not initialized");
    return mongoClient.db();
};

@injectable()
@singleton()
export class DayEndRepository {
    private get reconciliations() { return getDb().collection('dayendreconciliations'); }
    private get invoices() { return getDb().collection('invoices'); }
    private get expenses() { return getDb().collection('expenses'); }
    private get cheques() { return getDb().collection('cheques'); }
    private get suppliers() { return getDb().collection('suppliers'); }
    private get bills() { return getDb().collection('bills'); }
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

    async getLastReconciliation(tenantId: string, session?: ClientSession): Promise<any | null> {
        return this.reconciliations.findOne(
            { tenantId: new ObjectId(tenantId) },
            { session, sort: { date: -1 } }
        );
    }

    async aggregateCashSales(tenantId: string, startDate: Date, endDate: Date, session?: ClientSession): Promise<number> {
        const result = await this.invoices.aggregate([
            {
                $match: {
                    tenantId: new ObjectId(tenantId),
                    createdAt: { $gte: startDate, $lte: endDate },
                    $or: [{ paymentMethod: 'cash' }, { 'splitPaymentDetails.method': 'cash' }]
                }
            },
            { $unwind: { path: '$splitPaymentDetails', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: null,
                    totalCash: {
                        $sum: {
                            $cond: [
                                { $eq: ['$paymentMethod', 'cash'] },
                                '$paidAmount',
                                { $cond: [{ $eq: ['$splitPaymentDetails.method', 'cash'] }, '$splitPaymentDetails.amount', 0] }
                            ]
                        }
                    }
                }
            }
        ], { session } as any).toArray();
        return result.length > 0 ? result[0].totalCash : 0;
    }

    async aggregateCashExpenses(startDate: Date, endDate: Date, session?: ClientSession): Promise<number> {
        const result = await this.expenses.aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate }, paymentMethod: 'cash' } },
            { $group: { _id: null, totalCash: { $sum: '$amount' } } }
        ], { session } as any).toArray();
        return result.length > 0 ? result[0].totalCash : 0;
    }

    async findPendingCheques(tenantId: string, endDate: Date, session?: ClientSession): Promise<any[]> {
        return this.cheques.find(
            { tenantId: new ObjectId(tenantId), status: 'PENDING', date: { $lte: endDate } },
            { session }
        ).sort({ date: 1 }).toArray();
    }

    async findSuppliers(tenantId: string, session?: ClientSession): Promise<any[]> {
        return this.suppliers.find({ tenantId: new ObjectId(tenantId) }, { session }).toArray();
    }

    async aggregateUnpaidBillsForSupplier(supplierId: ObjectId | string, session?: ClientSession): Promise<number> {
        const result = await this.bills.aggregate([
            { $match: { supplier: new ObjectId(supplierId.toString()), status: 'unpaid' } },
            { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } }
        ], { session } as any).toArray();
        return result.length > 0 ? result[0].total : 0;
    }

    async upsertReconciliation(tenantId: string, dateKey: number, data: any, session?: ClientSession): Promise<any> {
        data.updatedAt = new Date();
        if (data.performedBy && typeof data.performedBy === 'string') data.performedBy = new ObjectId(data.performedBy);
        data.tenantId = new ObjectId(tenantId);

        return this.reconciliations.findOneAndUpdate(
            { tenantId: new ObjectId(tenantId), date: dateKey },
            { $set: data, $setOnInsert: { createdAt: new Date() } },
            { upsert: true, returnDocument: 'after', session }
        );
    }

    async findChequeById(id: string, tenantId: string, session?: ClientSession): Promise<any | null> {
        return this.cheques.findOne(
            { _id: new ObjectId(id), tenantId: new ObjectId(tenantId) },
            { session }
        );
    }

    async updateChequeStatus(id: string, status: string, session?: ClientSession): Promise<void> {
        await this.cheques.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status, updatedAt: new Date() } },
            { session }
        );
    }

    async createCashbankTransaction(data: any, session?: ClientSession): Promise<any> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.userId && typeof data.userId === 'string') data.userId = new ObjectId(data.userId);
        const result = await this.cashbankTransactions.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }

    async updateBankBalance(accountId: string, amount: number, txnId: ObjectId, session?: ClientSession): Promise<void> {
        await this.bankAccounts.updateOne(
            { _id: new ObjectId(accountId) },
            {
                $inc: { currentBalance: amount },
                $push: { transactions: txnId } as any,
                $set: { updatedAt: new Date() }
            },
            { session }
        );
    }
}
