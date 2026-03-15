import { injectable, singleton } from "tsyringe";
import { ObjectId, ClientSession } from "mongodb";
import { mongoClient } from '@smarterp/shared/config/database.js';

const getDb = () => {
    if (!mongoClient) throw new Error("MongoDB Client not initialized");
    return mongoClient.db();
};

@injectable()
@singleton()
export class ClearingParameterRepository {
    private get params() { return getDb().collection('clearingparameters'); }

    async find(query: any, session?: ClientSession): Promise<any[]> {
        if (query.tenantId && typeof query.tenantId === 'string') query.tenantId = new ObjectId(query.tenantId);
        return this.params.find(query, { session }).toArray();
    }

    async insertMany(docs: any[], session?: ClientSession): Promise<any[]> {
        const prepared = docs.map(d => ({
            ...d,
            createdAt: new Date(),
            updatedAt: new Date(),
            tenantId: typeof d.tenantId === 'string' ? new ObjectId(d.tenantId) : d.tenantId,
            userId: typeof d.userId === 'string' ? new ObjectId(d.userId) : d.userId,
        }));
        const result = await this.params.insertMany(prepared, { session });
        return prepared.map((d, i) => ({ ...d, _id: result.insertedIds[i] }));
    }

    async findOneAndUpdate(id: string, tenantId: string, updates: any, session?: ClientSession): Promise<any | null> {
        updates.updatedAt = new Date();
        return this.params.findOneAndUpdate(
            { _id: new ObjectId(id), tenantId: new ObjectId(tenantId) },
            { $set: updates },
            { returnDocument: 'after', session }
        );
    }
}
