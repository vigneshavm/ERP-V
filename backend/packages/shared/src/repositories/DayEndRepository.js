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
let DayEndRepository = class DayEndRepository {
    get reconciliations() { return getDb().collection('dayendreconciliations'); }
    get invoices() { return getDb().collection('invoices'); }
    get expenses() { return getDb().collection('expenses'); }
    get cheques() { return getDb().collection('cheques'); }
    get suppliers() { return getDb().collection('suppliers'); }
    get bills() { return getDb().collection('bills'); }
    get bankAccounts() { return getDb().collection('bankaccounts'); }
    get cashbankTransactions() { return getDb().collection('cashbanktransactions'); }
    async executeInTransaction(callback) {
        if (!mongoClient)
            throw new Error("MongoDB Client not initialized");
        const session = mongoClient.startSession();
        try {
            let result;
            await session.withTransaction(async () => {
                result = await callback(session);
            });
            return result;
        }
        finally {
            await session.endSession();
        }
    }
    async getLastReconciliation(tenantId, session) {
        return this.reconciliations.findOne({ tenantId: new ObjectId(tenantId) }, { session, sort: { date: -1 } });
    }
    async aggregateCashSales(tenantId, startDate, endDate, session) {
        const result = await this.invoices.aggregate([
            {
                $match: {
                    tenantId: new ObjectId(tenantId),
                    createdAt: { $gte: startDate, $lte: endDate },
                    $or: [{ paymentMethod: 'cash' }, { 'splitPaymentDetails.method': 'cash' }]
                }
            },
            { $unwind: { path: '$splitPaymentDetails', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: null,
                    totalCash: {
                        $sum: {
                            $cond: [
                                { $eq: ['$paymentMethod', 'cash'] },
                                '$paidAmount',
                                { $cond: [{ $eq: ['$splitPaymentDetails.method', 'cash'] }, '$splitPaymentDetails.amount', 0] }
                            ]
                        }
                    }
                }
            }
        ], { session }).toArray();
        return result.length > 0 ? result[0].totalCash : 0;
    }
    async aggregateCashExpenses(startDate, endDate, session) {
        const result = await this.expenses.aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate }, paymentMethod: 'cash' } },
            { $group: { _id: null, totalCash: { $sum: '$amount' } } }
        ], { session }).toArray();
        return result.length > 0 ? result[0].totalCash : 0;
    }
    async findPendingCheques(tenantId, endDate, session) {
        return this.cheques.find({ tenantId: new ObjectId(tenantId), status: 'PENDING', date: { $lte: endDate } }, { session }).sort({ date: 1 }).toArray();
    }
    async findSuppliers(tenantId, session) {
        return this.suppliers.find({ tenantId: new ObjectId(tenantId) }, { session }).toArray();
    }
    async aggregateUnpaidBillsForSupplier(supplierId, session) {
        const result = await this.bills.aggregate([
            { $match: { supplier: new ObjectId(supplierId.toString()), status: 'unpaid' } },
            { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } }
        ], { session }).toArray();
        return result.length > 0 ? result[0].total : 0;
    }
    async upsertReconciliation(tenantId, dateKey, data, session) {
        data.updatedAt = new Date();
        if (data.performedBy && typeof data.performedBy === 'string')
            data.performedBy = new ObjectId(data.performedBy);
        data.tenantId = new ObjectId(tenantId);
        return this.reconciliations.findOneAndUpdate({ tenantId: new ObjectId(tenantId), date: dateKey }, { $set: data, $setOnInsert: { createdAt: new Date() } }, { upsert: true, returnDocument: 'after', session });
    }
    async findChequeById(id, tenantId, session) {
        return this.cheques.findOne({ _id: new ObjectId(id), tenantId: new ObjectId(tenantId) }, { session });
    }
    async updateChequeStatus(id, status, session) {
        await this.cheques.updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } }, { session });
    }
    async createCashbankTransaction(data, session) {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.userId && typeof data.userId === 'string')
            data.userId = new ObjectId(data.userId);
        const result = await this.cashbankTransactions.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }
    async updateBankBalance(accountId, amount, txnId, session) {
        await this.bankAccounts.updateOne({ _id: new ObjectId(accountId) }, {
            $inc: { currentBalance: amount },
            $push: { transactions: txnId },
            $set: { updatedAt: new Date() }
        }, { session });
    }
};
DayEndRepository = __decorate([
    injectable(),
    singleton()
], DayEndRepository);
export { DayEndRepository };
