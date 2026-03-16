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
let LoanRepository = class LoanRepository {
    get loans() { return getDb().collection('loans'); }
    get loanPayments() { return getDb().collection('loanpayments'); }
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
    // Loan CRUD
    async createLoan(data, session) {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.tenantId && typeof data.tenantId === 'string')
            data.tenantId = new ObjectId(data.tenantId);
        if (data.userId && typeof data.userId === 'string')
            data.userId = new ObjectId(data.userId);
        data.status = data.status || 'active';
        const result = await this.loans.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }
    async findLoans(tenantId, session) {
        return this.loans.find({ tenantId: new ObjectId(tenantId) }, { session }).sort({ createdAt: -1 }).toArray();
    }
    async findLoanById(id, tenantId, session) {
        return this.loans.findOne({ _id: new ObjectId(id), tenantId: new ObjectId(tenantId) }, { session });
    }
    async updateLoan(id, tenantId, updates, session) {
        updates.updatedAt = new Date();
        return this.loans.findOneAndUpdate({ _id: new ObjectId(id), tenantId: new ObjectId(tenantId) }, { $set: updates }, { returnDocument: 'after', session });
    }
    // LoanPayment CRUD
    async findLoanPayments(loanId, tenantId, session) {
        const payments = await this.loanPayments.find({ loanId: new ObjectId(loanId), tenantId: new ObjectId(tenantId) }, { session }).sort({ paymentDate: -1 }).toArray();
        // Manually populate bankAccountId
        const bankIds = [...new Set(payments.map((p) => p.bankAccountId?.toString()).filter(Boolean))];
        const bankDocs = bankIds.length > 0
            ? await this.bankAccounts.find({ _id: { $in: bankIds.map((id) => new ObjectId(id)) } }, { session, projection: { bankName: 1, accountNumber: 1 } }).toArray()
            : [];
        const bankMap = new Map(bankDocs.map((b) => [b._id.toString(), b]));
        return payments.map((p) => ({
            ...p,
            bankAccountId: bankMap.get(p.bankAccountId?.toString()) || p.bankAccountId
        }));
    }
    async createLoanPayment(data, session) {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.tenantId && typeof data.tenantId === 'string')
            data.tenantId = new ObjectId(data.tenantId);
        if (data.userId && typeof data.userId === 'string')
            data.userId = new ObjectId(data.userId);
        if (data.loanId && typeof data.loanId === 'string')
            data.loanId = new ObjectId(data.loanId);
        if (data.bankAccountId && typeof data.bankAccountId === 'string')
            data.bankAccountId = new ObjectId(data.bankAccountId);
        const result = await this.loanPayments.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }
    // Bank Account helpers
    async findBankAccount(id, tenantId, session) {
        return this.bankAccounts.findOne({ _id: new ObjectId(id), tenantId: new ObjectId(tenantId) }, { session });
    }
    async updateBankAccountBalance(id, amount, session) {
        await this.bankAccounts.updateOne({ _id: new ObjectId(id) }, { $inc: { currentBalance: amount }, $set: { updatedAt: new Date() } }, { session });
    }
    // CashBank Transaction helper
    async createCashbankTransaction(data, session) {
        data.createdAt = new Date();
        data.updatedAt = new Date();
        if (data.userId && typeof data.userId === 'string')
            data.userId = new ObjectId(data.userId);
        const result = await this.cashbankTransactions.insertOne(data, { session });
        return { ...data, _id: result.insertedId };
    }
};
LoanRepository = __decorate([
    injectable(),
    singleton()
], LoanRepository);
export { LoanRepository };
