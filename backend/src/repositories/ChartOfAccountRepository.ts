import { injectable, singleton } from "tsyringe";
import ChartOfAccount from "../modules/finance/models/ChartOfAccount.js";
import { IChartOfAccount } from "../interfaces/IChartOfAccount.js";
import mongoose from "mongoose";

@injectable()
@singleton()
export class ChartOfAccountRepository {
    async findAll(tenantId: string): Promise<IChartOfAccount[]> {
        return ChartOfAccount.find({ tenantId: new mongoose.Types.ObjectId(tenantId) }).sort({ code: 1 });
    }

    async findById(id: string, tenantId: string): Promise<IChartOfAccount | null> {
        return ChartOfAccount.findOne({ _id: new mongoose.Types.ObjectId(id), tenantId: new mongoose.Types.ObjectId(tenantId) });
    }

    async findByCode(code: string, tenantId: string): Promise<IChartOfAccount | null> {
        return ChartOfAccount.findOne({ code, tenantId: new mongoose.Types.ObjectId(tenantId) });
    }

    async create(data: Partial<IChartOfAccount>): Promise<IChartOfAccount> {
        return ChartOfAccount.create(data);
    }

    async update(id: string, tenantId: string, data: Partial<IChartOfAccount>): Promise<IChartOfAccount | null> {
        return ChartOfAccount.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(id), tenantId: new mongoose.Types.ObjectId(tenantId) },
            { $set: data },
            { new: true }
        );
    }

    async delete(id: string, tenantId: string): Promise<IChartOfAccount | null> {
        return ChartOfAccount.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(id),
            tenantId: new mongoose.Types.ObjectId(tenantId),
            isSystem: false // Don't delete system accounts
        });
    }

    async updateBalance(id: string, amount: number): Promise<void> {
        await ChartOfAccount.updateOne(
            { _id: id },
            { $inc: { currentBalance: amount } }
        );
    }
}
