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
import Bill from "../models/Bill.js";
let BillRepository = class BillRepository extends BaseRepository {
    constructor() {
        super(Bill);
    }
    async findBills(query, session) {
        // Mongoose handles the sort and populate more elegantly
        return this.model.find(query)
            .sort({ createdAt: -1 })
            .populate('supplier', 'businessName')
            .session(session || null)
            .exec();
    }
    async findBillsPaginated(query, page, limit, sort, session) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.model.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('supplier', 'businessName')
                .session(session || null)
                .exec(),
            this.model.countDocuments(query).session(session || null).exec()
        ]);
        return { data, total };
    }
    async findBillById(id, userId, session) {
        return this.model.findOne({ _id: id, createdBy: userId })
            .populate('supplier')
            .session(session || null)
            .exec();
    }
    async findRawBill(id, userId, session) {
        return this.model.findOne({ _id: id, createdBy: userId }).session(session || null).exec();
    }
    async createBill(data, session) {
        const bill = new this.model(data);
        return bill.save({ session });
    }
    async updateBill(id, userId, updates, session) {
        if (updates.bankAccount === '')
            updates.bankAccount = undefined;
        return this.model.findOneAndUpdate({ _id: id, createdBy: userId }, { $set: updates }, { new: true, session }).populate('supplier', 'businessName').exec();
    }
    async updateBillFields(id, userId, updates, session) {
        return this.model.findOneAndUpdate({ _id: id, createdBy: userId }, { $set: updates }, { new: true, session }).populate('supplier', 'businessName').exec();
    }
    async deleteBill(id, userId, session) {
        const result = await this.model.deleteOne({ _id: id, createdBy: userId }).session(session || null).exec();
        return result.deletedCount > 0;
    }
    async generateBillNo(userId, session) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `BILL-${dateStr}`;
        const lastBill = await this.model.findOne({ billNo: { $regex: `^${prefix}` }, createdBy: userId }, null, { session, sort: { billNo: -1 } });
        let sequence = 1;
        if (lastBill && lastBill.billNo) {
            const parts = lastBill.billNo.split('-');
            if (parts.length >= 3) {
                const lastSequence = parseInt(parts[2]);
                if (!isNaN(lastSequence))
                    sequence = lastSequence + 1;
            }
        }
        return `${prefix}-${sequence.toString().padStart(3, '0')}`;
    }
    // Note: These helper methods for other domains are kept temporarily for compatibility 
    // but should be moved to their respective repositories in Phase 2.
    async findBankAccount(accountId, userId, session) {
        return this.model.db.model('BankAccount').findOne({ _id: accountId, userId: userId }, null, { session }).exec();
    }
    async updateBankBalance(accountId, userId, amount, txnId, session) {
        await this.model.db.model('BankAccount').updateOne({ _id: accountId, userId: userId }, {
            $inc: { currentBalance: amount },
            $push: { transactions: txnId },
            $set: { updatedAt: new Date() }
        }, { session });
    }
    async createCashbankTransaction(data, session) {
        const CashbankTransaction = this.model.db.model('CashbankTransaction');
        const txn = new CashbankTransaction({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return txn.save({ session });
    }
};
BillRepository = __decorate([
    singleton(),
    __metadata("design:paramtypes", [])
], BillRepository);
export { BillRepository };
