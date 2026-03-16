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
let BankStatementRepository = class BankStatementRepository {
    get transactions() { return getDb().collection('bankstatementtransactions'); }
    async insertMany(docs, session) {
        const prepared = docs.map(d => ({
            ...d,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: typeof d.userId === 'string' ? new ObjectId(d.userId) : d.userId,
        }));
        const result = await this.transactions.insertMany(prepared, { session });
        return prepared.map((d, i) => ({ ...d, _id: result.insertedIds[i] }));
    }
    async findTransactions(userId, status, session) {
        const filter = { userId: new ObjectId(userId) };
        if (status)
            filter.status = status;
        return this.transactions.find(filter, { session }).sort({ date: -1 }).toArray();
    }
};
BankStatementRepository = __decorate([
    injectable(),
    singleton()
], BankStatementRepository);
export { BankStatementRepository };
