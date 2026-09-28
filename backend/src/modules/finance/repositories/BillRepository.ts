import { injectable, singleton } from "tsyringe";
import { ClientSession } from "mongoose";
import Bill, { IBill } from "../models/Bill.js";

export interface IBillFilter {
    supplier?: string;
    status?: string;
    paymentStatus?: string | string[];
}

@injectable()
@singleton()
export class BillRepository {
    async create(data: Partial<IBill>, session?: ClientSession): Promise<IBill> {
        if (session) {
            return (await Bill.create([data], { session }))[0];
        }
        return Bill.create(data);
    }

    async findById(id: string, tenantId: string, session?: ClientSession): Promise<IBill | null> {
        const query = Bill.findOne({ _id: id, tenantId }).populate('supplier');
        if (session) {
            return query.session(session);
        }
        return query;
    }

    async findAll(tenantId: string, filters?: IBillFilter): Promise<IBill[]> {
        const query: any = { tenantId };

        if (filters?.supplier) {
            query.supplier = filters.supplier;
        }
        if (filters?.status) {
            query.status = filters.status;
        }
        if (filters?.paymentStatus) {
            if (Array.isArray(filters.paymentStatus)) {
                query.paymentStatus = { $in: filters.paymentStatus };
            } else {
                query.paymentStatus = filters.paymentStatus;
            }
        }

        return Bill.find(query)
            .populate('supplier', 'businessName')
            .sort({ createdAt: -1 });
    }

    async findLastBillByPrefix(prefix: string, tenantId: string): Promise<IBill | null> {
        return Bill.findOne({
            billNo: new RegExp(`^${prefix}`),
            tenantId
        }).sort({ billNo: -1 });
    }

    async update(id: string, tenantId: string, updates: Partial<IBill>, session?: ClientSession): Promise<IBill | null> {
        const query = Bill.findOneAndUpdate(
            { _id: id, tenantId },
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('supplier', 'businessName');

        if (session) {
            return query.session(session);
        }
        return query;
    }

    async delete(id: string, tenantId: string): Promise<boolean> {
        const result = await Bill.findOneAndDelete({ _id: id, tenantId });
        return !!result;
    }
}
