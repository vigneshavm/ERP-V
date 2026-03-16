import { singleton } from "tsyringe";
import { BaseRepository } from "@smarterp/shared/repositories/BaseRepository.js";
import Bill, { IBill } from "../models/Bill.js";
import { ClientSession, ObjectId } from "mongodb";

@singleton()
export class BillRepository extends BaseRepository<IBill> {
    constructor() {
        super(Bill);
    }

    async findBills(query: any, session?: ClientSession): Promise<IBill[]> {
        // Mongoose handles the sort and populate more elegantly
        return this.model.find(query)
            .sort({ createdAt: -1 })
            .populate('supplier', 'businessName')
            .session(session || null)
            .exec();
    }

    async findBillById(id: string, userId: string, session?: ClientSession): Promise<IBill | null> {
        return this.model.findOne({ _id: id, createdBy: userId })
            .populate('supplier')
            .session(session || null)
            .exec();
    }

    async findRawBill(id: string, userId: string, session?: ClientSession): Promise<IBill | null> {
        return this.model.findOne({ _id: id, createdBy: userId }).session(session || null).exec();
    }

    async createBill(data: Partial<IBill>, session?: ClientSession): Promise<IBill> {
        const bill = new this.model(data);
        return bill.save({ session }) as Promise<IBill>;
    }

    async updateBill(id: string, userId: string, updates: any, session?: ClientSession): Promise<IBill | null> {
        if (updates.bankAccount === '') updates.bankAccount = undefined;
        return this.model.findOneAndUpdate(
            { _id: id, createdBy: userId },
            { $set: updates },
            { new: true, session }
        ).populate('supplier', 'businessName').exec();
    }

    async updateBillFields(id: string, userId: string, updates: Partial<IBill>, session?: ClientSession): Promise<IBill | null> {
        return this.model.findOneAndUpdate(
            { _id: id, createdBy: userId },
            { $set: updates },
            { new: true, session }
        ).populate('supplier', 'businessName').exec();
    }

    async deleteBill(id: string, userId: string, session?: ClientSession): Promise<boolean> {
        const result = await this.model.deleteOne({ _id: id, createdBy: userId }).session(session || null).exec();
        return result.deletedCount > 0;
    }

    async generateBillNo(userId: string, session?: ClientSession): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `BILL-${dateStr}`;

        const lastBill = await this.model.findOne(
            { billNo: { $regex: `^${prefix}` }, createdBy: userId },
            null,
            { session, sort: { billNo: -1 } }
        );

        let sequence = 1;
        if (lastBill && lastBill.billNo) {
            const parts = lastBill.billNo.split('-');
            if (parts.length >= 3) {
                const lastSequence = parseInt(parts[2]);
                if (!isNaN(lastSequence)) sequence = lastSequence + 1;
            }
        }

        return `${prefix}-${sequence.toString().padStart(3, '0')}`;
    }

    // Note: These helper methods for other domains are kept temporarily for compatibility 
    // but should be moved to their respective repositories in Phase 2.
    
    async findBankAccount(accountId: string, userId: string, session?: ClientSession): Promise<any> {
        return this.model.db.model('BankAccount').findOne(
            { _id: accountId, userId: userId },
            null,
            { session }
        ).exec();
    }

    async updateBankBalance(accountId: string, userId: string, amount: number, txnId: ObjectId, session?: ClientSession): Promise<void> {
        await this.model.db.model('BankAccount').updateOne(
            { _id: accountId, userId: userId },
            {
                $inc: { currentBalance: amount },
                $push: { transactions: txnId } as any,
                $set: { updatedAt: new Date() }
            },
            { session }
        );
    }

    async createCashbankTransaction(data: any, session?: ClientSession): Promise<any> {
        const CashbankTransaction = this.model.db.model('CashbankTransaction');
        const txn = new CashbankTransaction({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return txn.save({ session });
    }
}
