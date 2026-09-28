import { injectable, singleton } from "tsyringe";
import { ClientSession } from "mongoose";
import Cheque from "../models/Cheque.js";
import { ICheque } from "../../../interfaces/ICheque.js";

export interface IChequeFilter {
    status?: string;
    type?: string;
    accountId?: string;
    startDate?: string | Date;
    endDate?: string | Date;
}

@injectable()
@singleton()
export class ChequeRepository {
    async create(data: Partial<ICheque>, tenantId: string, session?: ClientSession): Promise<ICheque> {
        const payload = { ...data, tenantId };
        if (session) {
            return (await Cheque.create([payload], { session }))[0];
        }
        return Cheque.create(payload);
    }

    async findById(id: string, tenantId: string, session?: ClientSession): Promise<ICheque | null> {
        const query = Cheque.findOne({ _id: id, tenantId }).populate('accountId', 'bankName accountNumber');
        if (session) {
            return query.session(session);
        }
        return query;
    }

    async findByNumberAndAccount(number: string, accountId: string, tenantId: string): Promise<ICheque | null> {
        return Cheque.findOne({ number, accountId, tenantId });
    }

    async findAll(tenantId: string, filters?: IChequeFilter): Promise<ICheque[]> {
        const query: any = { tenantId };

        if (filters?.status) {
            query.status = filters.status;
        }
        if (filters?.type) {
            query.type = filters.type;
        }
        if (filters?.accountId) {
            query.accountId = filters.accountId;
        }
        if (filters?.startDate || filters?.endDate) {
            query.date = {};
            if (filters.startDate) query.date.$gte = new Date(filters.startDate);
            if (filters.endDate) query.date.$lte = new Date(filters.endDate);
        }

        return Cheque.find(query)
            .populate('accountId', 'bankName accountNumber')
            .sort({ date: -1 });
    }

    async updateStatus(
        id: string,
        tenantId: string,
        status: 'PENDING' | 'CLEARED' | 'BOUNCED',
        session?: ClientSession
    ): Promise<ICheque | null> {
        const query = Cheque.findOneAndUpdate(
            { _id: id, tenantId },
            { $set: { status } },
            { new: true }
        );
        if (session) {
            return query.session(session);
        }
        return query;
    }

    async getUnclearedCheques(tenantId: string, accountId?: string): Promise<ICheque[]> {
        const query: any = { tenantId, status: 'PENDING' };
        if (accountId) {
            query.accountId = accountId;
        }
        return Cheque.find(query);
    }
}
