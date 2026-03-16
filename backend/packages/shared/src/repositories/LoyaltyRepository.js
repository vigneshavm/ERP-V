var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable, singleton } from "tsyringe";
import { ObjectId } from "mongodb";
import { mongoClient } from '@smarterp/shared/config/database.js';
const getDb = () => {
    if (!mongoClient)
        throw new Error("MongoDB Client not initialized");
    return mongoClient.db();
};
let LoyaltyRepository = class LoyaltyRepository {
    get loyaltyTransactions() { return getDb().collection('loyaltytransactions'); }
    get customers() { return getDb().collection('customers'); }
    async findCustomer(id, ownerId, projection, session) {
        return this.customers.findOne({ _id: new ObjectId(id), owner: new ObjectId(ownerId) }, { session, projection });
    }
    async updateCustomer(id, updates, session) {
        updates.updatedAt = new Date();
        await this.customers.updateOne({ _id: new ObjectId(id) }, { $set: updates }, { session });
    }
    async findLoyaltyTransactions(customerId, ownerId, session) {
        return this.loyaltyTransactions.find({ customer: new ObjectId(customerId), owner: new ObjectId(ownerId) }, { session }).sort({ createdAt: -1 }).toArray();
    }
    async createLoyaltyTransaction(data, session) {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.customer && typeof data.customer === 'string')
            data.customer = new ObjectId(data.customer);
        if (data.owner && typeof data.owner === 'string')
            data.owner = new ObjectId(data.owner);
        const result = await this.loyaltyTransactions.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }
};
LoyaltyRepository = __decorate([
    injectable(),
    singleton()
], LoyaltyRepository);
export { LoyaltyRepository };
