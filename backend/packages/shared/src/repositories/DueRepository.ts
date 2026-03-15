import { injectable, singleton } from "tsyringe";
import { ObjectId, ClientSession } from "mongodb";
import { mongoClient } from '@smarterp/shared/config/database.js';

const getDb = () => {
    if (!mongoClient) throw new Error("MongoDB Client not initialized");
    return mongoClient.db();
};

@injectable()
@singleton()
export class DueRepository {
    private get dueAdjustments() { return getDb().collection('dueadjustments'); }
    private get customers() { return getDb().collection('customers'); }
    private get transactions() { return getDb().collection('transactions'); }
    private get users() { return getDb().collection('users'); }

    async findCustomer(customerId: string, ownerId: string, session?: ClientSession): Promise<any | null> {
        return this.customers.findOne(
            { _id: new ObjectId(customerId), owner: new ObjectId(ownerId) },
            { session }
        );
    }

    async updateCustomerDues(customerId: string, amount: number, session?: ClientSession): Promise<void> {
        await this.customers.updateOne(
            { _id: new ObjectId(customerId) },
            { $inc: { dues: amount }, $set: { updatedAt: new Date() } },
            { session }
        );
    }

    async createAdjustment(data: any, session?: ClientSession): Promise<any> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.customer && typeof data.customer === 'string') data.customer = new ObjectId(data.customer);
        if (data.createdBy && typeof data.createdBy === 'string') data.createdBy = new ObjectId(data.createdBy);

        const result = await this.dueAdjustments.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }

    async findAdjustmentById(id: string, session?: ClientSession): Promise<any | null> {
        const adj = await this.dueAdjustments.findOne({ _id: new ObjectId(id) }, { session });
        if (!adj) return null;
        return this.populateAdjustment(adj, session);
    }

    async findAdjustments(userId: string, session?: ClientSession): Promise<any[]> {
        const adjustments = await this.dueAdjustments.find(
            { createdBy: new ObjectId(userId) },
            { session }
        ).sort({ createdAt: -1 }).toArray();

        return Promise.all(adjustments.map((a: any) => this.populateAdjustment(a, session)));
    }

    async findCustomerAdjustments(customerId: string, userId: string, session?: ClientSession): Promise<any[]> {
        const adjustments = await this.dueAdjustments.find(
            { customer: new ObjectId(customerId), createdBy: new ObjectId(userId) },
            { session }
        ).sort({ createdAt: -1 }).toArray();

        return Promise.all(adjustments.map((a: any) => this.populateAdjustment(a, session)));
    }

    async createTransaction(data: any, session?: ClientSession): Promise<any> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.customer && typeof data.customer === 'string') data.customer = new ObjectId(data.customer);
        if (data.dueAdjustment && typeof data.dueAdjustment === 'string') data.dueAdjustment = new ObjectId(data.dueAdjustment);

        const result = await this.transactions.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }

    // Helper to populate customer and createdBy
    private async populateAdjustment(adj: any, session?: ClientSession): Promise<any> {
        if (adj.customer) {
            const customer = await this.customers.findOne(
                { _id: new ObjectId(adj.customer.toString()) },
                { session, projection: { name: 1, phone: 1, email: 1, dues: 1 } }
            );
            if (customer) adj.customer = customer;
        }
        if (adj.createdBy) {
            const user = await this.users.findOne(
                { _id: new ObjectId(adj.createdBy.toString()) },
                { session, projection: { name: 1, email: 1 } }
            );
            if (user) adj.createdBy = user;
        }
        return adj;
    }
}
