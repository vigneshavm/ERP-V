import { injectable, singleton } from "tsyringe";
import PersonalTransaction from "../modules/expense/models/PersonalTransaction.js";
import { IPersonalTransaction } from "../interfaces/IPersonalTransaction.js";

@injectable()
@singleton()
export class PersonalTransactionRepository {
    async create(transactionData: Partial<IPersonalTransaction>): Promise<IPersonalTransaction> {
        return PersonalTransaction.create(transactionData);
    }

    async findById(id: string, userId: string): Promise<IPersonalTransaction | null> {
        return PersonalTransaction.findOne({ _id: id, createdBy: userId }).populate("category account");
    }

    async findAll(userId: string): Promise<IPersonalTransaction[]> {
        return PersonalTransaction.find({ createdBy: userId })
            .populate("category account")
            .sort({ date: -1 });
    }

    async update(id: string, userId: string, updateData: Partial<IPersonalTransaction>): Promise<IPersonalTransaction | null> {
        return PersonalTransaction.findOneAndUpdate(
            { _id: id, createdBy: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate("category account");
    }

    async delete(id: string, userId: string): Promise<IPersonalTransaction | null> {
        return PersonalTransaction.findOneAndDelete({ _id: id, createdBy: userId });
    }

    async getStats(userId: string, startDate: Date, endDate: Date): Promise<any> {
        return PersonalTransaction.aggregate([
            {
                $match: {
                    createdBy: new mongoose.Types.ObjectId(userId),
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: "$type",
                    total: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);
    }
}

import mongoose from "mongoose";
