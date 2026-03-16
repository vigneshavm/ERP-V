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
let ClearingParameterRepository = class ClearingParameterRepository {
    get params() { return getDb().collection('clearingparameters'); }
    async find(query, session) {
        if (query.tenantId && typeof query.tenantId === 'string')
            query.tenantId = new ObjectId(query.tenantId);
        return this.params.find(query, { session }).toArray();
    }
    async insertMany(docs, session) {
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
    async findOneAndUpdate(id, tenantId, updates, session) {
        updates.updatedAt = new Date();
        return this.params.findOneAndUpdate({ _id: new ObjectId(id), tenantId: new ObjectId(tenantId) }, { $set: updates }, { returnDocument: 'after', session });
    }
};
ClearingParameterRepository = __decorate([
    injectable(),
    singleton()
], ClearingParameterRepository);
export { ClearingParameterRepository };
