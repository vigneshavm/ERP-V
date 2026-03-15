import { injectable, singleton } from "tsyringe";
import { ObjectId, ClientSession } from "mongodb";
import { mongoClient } from '@smarterp/shared/config/database.js';

const getDb = () => {
    if (!mongoClient) throw new Error("MongoDB Client not initialized");
    return mongoClient.db();
};

@injectable()
@singleton()
export class BankStatementRepository {
    private get transactions() { return getDb().collection('bankstatementtransactions'); }

    async insertMany(docs: any[], session?: ClientSession): Promise<any[]> {
        const prepared = docs.map(d => ({
            ...d,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: typeof d.userId === 'string' ? new ObjectId(d.userId) : d.userId,
        }));
        const result = await this.transactions.insertMany(prepared, { session });
        return prepared.map((d, i) => ({ ...d, _id: result.insertedIds[i] }));
    }

    async findTransactions(userId: string, status?: string, session?: ClientSession): Promise<any[]> {
        const filter: any = { userId: new ObjectId(userId) };
        if (status) filter.status = status;
        return this.transactions.find(filter, { session }).sort({ date: -1 }).toArray();
    }
}
