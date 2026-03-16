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
let DueRepository = class DueRepository {
    get dueAdjustments() { return getDb().collection('dueadjustments'); }
    get customers() { return getDb().collection('customers'); }
    get transactions() { return getDb().collection('transactions'); }
    get users() { return getDb().collection('users'); }
    async findCustomer(customerId, ownerId, session) {
        return this.customers.findOne({ _id: new ObjectId(customerId), owner: new ObjectId(ownerId) }, { session });
    }
    async updateCustomerDues(customerId, amount, session) {
        await this.customers.updateOne({ _id: new ObjectId(customerId) }, { $inc: { dues: amount }, $set: { updatedAt: new Date() } }, { session });
    }
    async createAdjustment(data, session) {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.customer && typeof data.customer === 'string')
            data.customer = new ObjectId(data.customer);
        if (data.createdBy && typeof data.createdBy === 'string')
            data.createdBy = new ObjectId(data.createdBy);
        const result = await this.dueAdjustments.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }
    async findAdjustmentById(id, session) {
        const adj = await this.dueAdjustments.findOne({ _id: new ObjectId(id) }, { session });
        if (!adj)
            return null;
        return this.populateAdjustment(adj, session);
    }
    async findAdjustments(userId, session) {
        const adjustments = await this.dueAdjustments.find({ createdBy: new ObjectId(userId) }, { session }).sort({ createdAt: -1 }).toArray();
        return Promise.all(adjustments.map((a) => this.populateAdjustment(a, session)));
    }
    async findCustomerAdjustments(customerId, userId, session) {
        const adjustments = await this.dueAdjustments.find({ customer: new ObjectId(customerId), createdBy: new ObjectId(userId) }, { session }).sort({ createdAt: -1 }).toArray();
        return Promise.all(adjustments.map((a) => this.populateAdjustment(a, session)));
    }
    async createTransaction(data, session) {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.customer && typeof data.customer === 'string')
            data.customer = new ObjectId(data.customer);
        if (data.dueAdjustment && typeof data.dueAdjustment === 'string')
            data.dueAdjustment = new ObjectId(data.dueAdjustment);
        const result = await this.transactions.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }
    // Helper to populate customer and createdBy
    async populateAdjustment(adj, session) {
        if (adj.customer) {
            const customer = await this.customers.findOne({ _id: new ObjectId(adj.customer.toString()) }, { session, projection: { name: 1, phone: 1, email: 1, dues: 1 } });
            if (customer)
                adj.customer = customer;
        }
        if (adj.createdBy) {
            const user = await this.users.findOne({ _id: new ObjectId(adj.createdBy.toString()) }, { session, projection: { name: 1, email: 1 } });
            if (user)
                adj.createdBy = user;
        }
        return adj;
    }
};
DueRepository = __decorate([
    injectable(),
    singleton()
], DueRepository);
export { DueRepository };
