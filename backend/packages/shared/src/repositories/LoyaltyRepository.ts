import { injectable, singleton } from "tsyringe";
import { ObjectId, ClientSession } from "mongodb";
import { mongoClient } from '@smarterp/shared/config/database.js';

const getDb = () => {
    if (!mongoClient) throw new Error("MongoDB Client not initialized");
    return mongoClient.db();
};

@injectable()
@singleton()
export class LoyaltyRepository {
    private get loyaltyTransactions() { return getDb().collection('loyaltytransactions'); }
    private get customers() { return getDb().collection('customers'); }

    async findCustomer(id: string, ownerId: string, projection?: Record<string, number>, session?: ClientSession): Promise<any | null> {
        return this.customers.findOne(
            { _id: new ObjectId(id), owner: new ObjectId(ownerId) },
            { session, projection }
        );
    }

    async updateCustomer(id: string, updates: any, session?: ClientSession): Promise<void> {
        updates.updatedAt = new Date();
        await this.customers.updateOne(
            { _id: new ObjectId(id) },
            { $set: updates },
            { session }
        );
    }

    async findLoyaltyTransactions(customerId: string, ownerId: string, session?: ClientSession): Promise<any[]> {
        return this.loyaltyTransactions.find(
            { customer: new ObjectId(customerId), owner: new ObjectId(ownerId) },
            { session }
        ).sort({ createdAt: -1 }).toArray();
    }

    async createLoyaltyTransaction(data: any, session?: ClientSession): Promise<any> {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.customer && typeof data.customer === 'string') data.customer = new ObjectId(data.customer);
        if (data.owner && typeof data.owner === 'string') data.owner = new ObjectId(data.owner);

        const result = await this.loyaltyTransactions.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }
}
