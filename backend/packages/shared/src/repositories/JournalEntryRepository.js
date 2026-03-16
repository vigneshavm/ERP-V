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
let JournalEntryRepository = class JournalEntryRepository {
    get entries() { return getDb().collection('journalentries'); }
    get users() { return getDb().collection('users'); }
    async create(data, session) {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.tenantId && typeof data.tenantId === 'string')
            data.tenantId = new ObjectId(data.tenantId);
        if (data.createdBy && typeof data.createdBy === 'string')
            data.createdBy = new ObjectId(data.createdBy);
        if (data.branchId && typeof data.branchId === 'string')
            data.branchId = new ObjectId(data.branchId);
        const result = await this.entries.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }
    async findAll(query, session) {
        if (query.tenantId && typeof query.tenantId === 'string')
            query.tenantId = new ObjectId(query.tenantId);
        const entries = await this.entries.find(query, { session })
            .sort({ date: -1 })
            .toArray();
        // Populate createdBy
        const userIds = [...new Set(entries.map((e) => e.createdBy?.toString()).filter(Boolean))];
        const userDocs = userIds.length > 0
            ? await this.users.find({ _id: { $in: userIds.map((id) => new ObjectId(id)) } }, { session, projection: { name: 1, email: 1 } }).toArray()
            : [];
        const userMap = new Map(userDocs.map((u) => [u._id.toString(), u]));
        return entries.map((e) => ({
            ...e,
            createdBy: userMap.get(e.createdBy?.toString()) || e.createdBy
        }));
    }
    async findById(id, session) {
        const entry = await this.entries.findOne({ _id: new ObjectId(id) }, { session });
        if (!entry)
            return null;
        // Populate createdBy
        if (entry.createdBy) {
            const user = await this.users.findOne({ _id: new ObjectId(entry.createdBy.toString()) }, { session, projection: { name: 1 } });
            if (user)
                entry.createdBy = user;
        }
    }
    async updateStatus(id, status, session) {
        await this.entries.updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } }, { session });
    }
};
JournalEntryRepository = __decorate([
    injectable(),
    singleton()
], JournalEntryRepository);
export { JournalEntryRepository };
