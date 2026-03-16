var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { singleton } from "tsyringe";
import { BaseRepository } from "@smarterp/shared/repositories/BaseRepository.js";
import BankAccount from "../models/BankAccount.js";
import { ObjectId } from "mongodb";
import crypto from "crypto";
let CashBankRepository = class CashBankRepository extends BaseRepository {
    constructor() {
        super(BankAccount);
    }
    // Cryptography Helpers (Standardized)
    encryptAccountNumber(accountNumber) {
        const algorithm = "aes-256-cbc";
        const secret = process.env.ENCRYPTION_KEY || process.env.COOKIE_SECRET || "default_fallback_secret_must_be_long";
        const key = crypto.scryptSync(secret, "salt", 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(accountNumber, "utf8", "hex");
        encrypted += cipher.final("hex");
        return iv.toString("hex") + ":" + encrypted;
    }
    decryptAccountNumber(encryptedAccountNumber) {
        if (!encryptedAccountNumber)
            return encryptedAccountNumber;
        const parts = encryptedAccountNumber.split(":");
        if (parts.length < 2)
            return encryptedAccountNumber;
        const iv = Buffer.from(parts[0], "hex");
        const encrypted = parts[1];
        const algorithm = "aes-256-cbc";
        const secret = process.env.ENCRYPTION_KEY || process.env.COOKIE_SECRET || "default_fallback_secret_must_be_long";
        const key = crypto.scryptSync(secret, "salt", 32);
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }
    // Bank Account Methods
    async createAccount(data, session) {
        if (data.accountNumber) {
            data.accountNumber = this.encryptAccountNumber(data.accountNumber);
        }
        return this.create(data, session);
    }
    async findAccountById(id, userId, session) {
        return this.model.findOne({ _id: id, userId: userId }).session(session || null).exec();
    }
    async findAccountByNumber(accountNumber, userId, session) {
        // Since we encrypt, we need to fetch all and decrypt, or use a deterministic hash for lookup.
        // For now, keeping the current logic of fetching all user accounts.
        const allAccounts = await this.model.find({ userId }).session(session || null).exec();
        const match = allAccounts.find((acc) => this.decryptAccountNumber(acc.accountNumber) === accountNumber);
        return match || null;
    }
    async getAccounts(userId, session) {
        return this.model.find({ userId }).session(session || null).exec();
    }
    async updateAccount(id, userId, updates, session) {
        if (updates.accountNumber) {
            updates.accountNumber = this.encryptAccountNumber(updates.accountNumber);
        }
        return this.model.findOneAndUpdate({ _id: id, userId: userId }, { $set: updates }, { new: true, session }).exec();
    }
    async updateBalance(id, amount, session) {
        await this.model.updateOne({ _id: id }, { $inc: { currentBalance: amount }, $set: { updatedAt: new Date() } }, { session });
    }
    // Transaction Methods
    get TransactionModel() { return this.model.db.model('CashbankTransaction'); }
    get ChequeModel() { return this.model.db.model('Cheque'); }
    async createTransaction(data, session) {
        const txn = new this.TransactionModel(data);
        return txn.save({ session });
    }
    async findTransactionById(id, userId, session) {
        return this.TransactionModel.findOne({ _id: id, userId: userId }).session(session || null).exec();
    }
    async getTransactions(userId, accountId, session) {
        return this.TransactionModel.find({
            userId,
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        }).sort({ date: -1 }).session(session || null).exec();
    }
    async getLedgerTransactions(accountId, userId, startDate, endDate, reconciled, session) {
        const query = {
            userId,
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        };
        if (startDate || endDate) {
            query.date = {};
            if (startDate)
                query.date.$gte = startDate;
            if (endDate)
                query.date.$lte = endDate;
        }
        if (reconciled !== undefined)
            query.reconciled = reconciled;
        return this.TransactionModel.find(query).sort({ date: 1, createdAt: 1 }).session(session || null).exec();
    }
    async updateTransaction(id, userId, updates, session) {
        return this.TransactionModel.findOneAndUpdate({ _id: id, userId: userId }, { $set: updates }, { new: true, session }).exec();
    }
    async updateManyTransactions(ids, userId, updates, session) {
        return this.TransactionModel.updateMany({ _id: { $in: ids }, userId }, { $set: updates }, { session }).exec();
    }
    async countTransactions(accountId, session) {
        return this.TransactionModel.countDocuments({
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        }).session(session || null).exec();
    }
    async deleteAccount(id, userId, session) {
        return this.model.findOneAndDelete({ _id: id, userId: userId }).session(session || null).exec();
    }
    async getPriorTransactionsSum(accountId, userId, beforeDate, session) {
        const txns = await this.TransactionModel.find({
            userId,
            date: { $lt: beforeDate },
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        }).session(session || null).exec();
        return txns.reduce((sum, t) => {
            const isMoneyIn = t.toAccount.toString() === accountId;
            return sum + (isMoneyIn ? t.amount : -t.amount);
        }, 0);
    }
    async getPendingIssuedCheques(accountId, userId, upToDate, session) {
        const query = {
            accountId,
            type: 'ISSUED',
            status: 'PENDING',
            userId
        };
        if (upToDate)
            query.date = { $lte: upToDate };
        return this.ChequeModel.find(query).sort({ date: 1 }).session(session || null).exec();
    }
    async getDailyCashTransactions(userId, start, end, type, session) {
        return this.TransactionModel.find({
            userId,
            type,
            [type === 'in' ? 'toAccount' : 'fromAccount']: 'cash',
            date: { $gte: start, $lte: end }
        }).session(session || null).exec();
    }
    async getDailyCheques(userId, start, end, status, session) {
        const query = {
            userId,
            date: { $gte: start, $lte: end }
        };
        if (status)
            query.status = status;
        return this.ChequeModel.find(query).sort({ date: 1 }).session(session || null).exec();
    }
    async queryTransactions(query, sortQuery = { date: 1, createdAt: 1 }, session) {
        return this.TransactionModel.find(query).sort(sortQuery).session(session || null).exec();
    }
    async getCashBalance(userId, session) {
        const cashIn = await this.TransactionModel.aggregate([
            { $match: { userId: new ObjectId(userId), toAccount: 'cash' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ], { session }).exec();
        const cashOut = await this.TransactionModel.aggregate([
            { $match: { userId: new ObjectId(userId), fromAccount: 'cash' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ], { session }).exec();
        return (cashIn[0]?.total || 0) - (cashOut[0]?.total || 0);
    }
    // Cheque Methods
    async findChequeById(id, userId, session) {
        return this.ChequeModel.findOne({ _id: id, userId: userId }).session(session || null).exec();
    }
    async createCheque(data, session) {
        const cheque = new this.ChequeModel(data);
        return cheque.save({ session });
    }
    async updateCheque(id, userId, updates, session) {
        return this.ChequeModel.findOneAndUpdate({ _id: id, userId: userId }, { $set: updates }, { new: true, session }).exec();
    }
    async queryCheques(query, sortQuery = { date: 1 }, session) {
        if (query.userId && typeof query.userId === 'string')
            query.userId = new ObjectId(query.userId);
        return this.ChequeModel.find(query).sort(sortQuery).session(session || null).exec();
    }
};
CashBankRepository = __decorate([
    singleton(),
    __metadata("design:paramtypes", [])
], CashBankRepository);
export { CashBankRepository };
