import { injectable, singleton } from "tsyringe";
import { IBill } from '@smarterp/shared/interfaces/IBill.js';
import { ICashbankTransaction } from '@smarterp/shared/interfaces/ICashbankTransaction.js';
import { IBankAccount } from '@smarterp/shared/interfaces/IBankAccount.js';
import { ObjectId, ClientSession } from "mongodb";
import { mongoClient } from '@smarterp/shared/config/database.js';

const getDb = () => {
    if (!mongoClient) throw new Error("MongoDB Client not initialized");
    return mongoClient.db();
};

@injectable()
@singleton()
export class BillRepository {
    private get bills() { return getDb().collection('bills'); }
    private get cashbankTransactions() { return getDb().collection('cashbanktransactions'); }
    private get bankAccounts() { return getDb().collection('bankaccounts'); }
    private get suppliers() { return getDb().collection('suppliers'); }

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

    // Bill CRUD
    async findBills(query: any, session?: ClientSession): Promise<any[]> {
        if (query.createdBy && typeof query.createdBy === 'string') query.createdBy = new ObjectId(query.createdBy);
        if (query.supplier && typeof query.supplier === 'string') query.supplier = new ObjectId(query.supplier);

        const bills = await this.bills.find(query, { session }).sort({ createdAt: -1 }).toArray();

        // Manually populate supplier name
        const supplierIds = [...new Set(bills.map((b: any) => b.supplier?.toString()).filter(Boolean))] as string[];
        const supplierDocs = supplierIds.length > 0
            ? await this.suppliers.find({ _id: { $in: supplierIds.map((id) => new ObjectId(id)) } }, { session, projection: { businessName: 1 } }).toArray()
            : [];
        const supplierMap = new Map(supplierDocs.map((s: any) => [s._id.toString(), s]));

        return bills.map((b: any) => ({
            ...b,
            supplier: supplierMap.get(b.supplier?.toString()) || b.supplier
        }));
    }

    async findBillById(id: string, userId: string, session?: ClientSession): Promise<IBill | null> {
        const bill = await this.bills.findOne(
            { _id: new ObjectId(id), createdBy: new ObjectId(userId) },
            { session }
        );
        if (!bill) return null;

        // Populate supplier
        if (bill.supplier) {
            const supplier = await this.suppliers.findOne(
                { _id: new ObjectId(bill.supplier.toString()) },
                { session }
            );
            if (supplier) bill.supplier = supplier;
        }
        return bill as unknown as IBill;
    }

    async createBill(data: Partial<IBill>, session?: ClientSession): Promise<IBill> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.createdBy && typeof data.createdBy === 'string') data.createdBy = new ObjectId(data.createdBy);
        if (data.supplier && typeof data.supplier === 'string') data.supplier = new ObjectId(data.supplier);
        if (data.bankAccount && typeof data.bankAccount === 'string') data.bankAccount = new ObjectId(data.bankAccount);
        if (data.grnId && typeof data.grnId === 'string') data.grnId = new ObjectId(data.grnId);
        if (data.purchaseOrderId && typeof data.purchaseOrderId === 'string') data.purchaseOrderId = new ObjectId(data.purchaseOrderId);

        const result = await this.bills.insertOne(data as any, { session });
        return { ...data, _id: result.insertedId } as IBill;
    }

    async updateBill(id: string, userId: string, updates: any, session?: ClientSession): Promise<IBill | null> {
        updates.updatedAt = new Date();
        // Clean up bankAccount field
        if (updates.bankAccount === '') updates.bankAccount = undefined;

        const result = await this.bills.findOneAndUpdate(
            { _id: new ObjectId(id), createdBy: new ObjectId(userId) },
            { $set: updates },
            { returnDocument: 'after', session }
        );
        if (!result) return null;

        // Populate supplier
        if (result.supplier) {
            const supplier = await this.suppliers.findOne(
                { _id: new ObjectId(result.supplier.toString()) },
                { session, projection: { businessName: 1 } }
            );
            if (supplier) result.supplier = supplier;
        }
        return result as unknown as IBill;
    }

    async deleteBill(id: string, userId: string, session?: ClientSession): Promise<boolean> {
        const result = await this.bills.deleteOne(
            { _id: new ObjectId(id), createdBy: new ObjectId(userId) },
            { session }
        );
        return result.deletedCount > 0;
    }

    async findRawBill(id: string, userId: string, session?: ClientSession): Promise<IBill | null> {
        return this.bills.findOne(
            { _id: new ObjectId(id), createdBy: new ObjectId(userId) },
            { session }
        ) as unknown as Promise<IBill | null>;
    }

    async updateBillFields(id: string, userId: string, updates: Partial<IBill>, session?: ClientSession): Promise<IBill | null> {
        updates.updatedAt = new Date();
        if (updates.bankAccount && typeof updates.bankAccount === 'string') {
            updates.bankAccount = new ObjectId(updates.bankAccount);
        }
        const result = await this.bills.findOneAndUpdate(
            { _id: new ObjectId(id), createdBy: new ObjectId(userId) },
            { $set: updates },
            { returnDocument: 'after', session }
        );
        if (!result) return null;

        // Populate supplier
        if (result.supplier) {
            const supplier = await this.suppliers.findOne(
                { _id: new ObjectId(result.supplier.toString()) },
                { session, projection: { businessName: 1 } }
            );
            if (supplier) result.supplier = supplier;
        }
        return result as unknown as IBill;
    }

    // Bill Number Generation
    async generateBillNo(userId: string, session?: ClientSession): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `BILL-${dateStr}`;

        const lastBill = await this.bills.findOne(
            { billNo: { $regex: `^${prefix}` }, createdBy: new ObjectId(userId) },
            { session, sort: { billNo: -1 } }
        );

        let sequence = 1;
        if (lastBill && lastBill.billNo) {
            const parts = lastBill.billNo.split('-');
            if (parts.length >= 3) {
                const lastSequence = parseInt(parts[2]);
                if (!isNaN(lastSequence)) sequence = lastSequence + 1;
            }
        }

        return `${prefix}-${sequence.toString().padStart(3, '0')}`;
    }

    // Bank Account helpers
    async findBankAccount(accountId: string, userId: string, session?: ClientSession): Promise<IBankAccount | null> {
        return this.bankAccounts.findOne(
            { _id: new ObjectId(accountId), userId: new ObjectId(userId) },
            { session }
        ) as unknown as Promise<IBankAccount | null>;
    }

    async updateBankBalance(accountId: string, userId: string, amount: number, txnId: ObjectId, session?: ClientSession): Promise<void> {
        await this.bankAccounts.updateOne(
            { _id: new ObjectId(accountId), userId: new ObjectId(userId) },
            {
                $inc: { currentBalance: amount },
                $push: { transactions: txnId } as any,
                $set: { updatedAt: new Date() }
            },
            { session }
        );
    }

    // CashBank Transaction helper
    async createCashbankTransaction(data: Partial<ICashbankTransaction>, session?: ClientSession): Promise<ICashbankTransaction> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.userId && typeof data.userId === 'string') data.userId = new ObjectId(data.userId) as any;

        const result = await this.cashbankTransactions.insertOne(data as any, { session });
        return { ...data, _id: result.insertedId } as ICashbankTransaction;
    }
}
