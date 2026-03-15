import { injectable, singleton } from "tsyringe";
import { ObjectId, ClientSession } from "mongodb";
import { mongoClient } from "../config/database.js";

const getDb = () => {
    if (!mongoClient) throw new Error("MongoDB Client not initialized");
    return mongoClient.db();
};

@injectable()
@singleton()
export class JournalEntryRepository {
    private get entries() { return getDb().collection('journalentries'); }
    private get users() { return getDb().collection('users'); }

    async create(data: any, session?: ClientSession): Promise<any> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.tenantId && typeof data.tenantId === 'string') data.tenantId = new ObjectId(data.tenantId);
        if (data.createdBy && typeof data.createdBy === 'string') data.createdBy = new ObjectId(data.createdBy);
        if (data.branchId && typeof data.branchId === 'string') data.branchId = new ObjectId(data.branchId);

        const result = await this.entries.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }

    async findAll(query: any, session?: ClientSession): Promise<any[]> {
        if (query.tenantId && typeof query.tenantId === 'string') query.tenantId = new ObjectId(query.tenantId);

        const entries = await this.entries.find(query, { session })
            .sort({ date: -1 })
            .toArray();

        // Populate createdBy
        const userIds = [...new Set(entries.map((e: any) => e.createdBy?.toString()).filter(Boolean))] as string[];
        const userDocs = userIds.length > 0
            ? await this.users.find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } }, { session, projection: { name: 1, email: 1 } }).toArray()
            : [];
        const userMap = new Map(userDocs.map((u: any) => [u._id.toString(), u]));

        return entries.map((e: any) => ({
            ...e,
            createdBy: userMap.get(e.createdBy?.toString()) || e.createdBy
        }));
    }

    async findById(id: string, session?: ClientSession): Promise<any | null> {
        const entry = await this.entries.findOne({ _id: new ObjectId(id) }, { session });
        if (!entry) return null;

        // Populate createdBy
        if (entry.createdBy) {
            const user = await this.users.findOne(
                { _id: new ObjectId(entry.createdBy.toString()) },
                { session, projection: { name: 1 } }
            );
            if (user) entry.createdBy = user;
        }
    }
    
    async updateStatus(id: string, status: string, session?: ClientSession): Promise<void> {
        await this.entries.updateOne(
            { _id: new ObjectId(id) },
            { $set: { status, updatedAt: new Date() } },
            { session }
        );
    }
}
