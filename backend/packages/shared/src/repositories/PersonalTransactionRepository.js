var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable, singleton } from "tsyringe";
import PersonalTransaction from '@smarterp/core/modules/expense/models/PersonalTransaction.js';
let PersonalTransactionRepository = class PersonalTransactionRepository {
    async create(transactionData) {
        return PersonalTransaction.create(transactionData);
    }
    async findById(id, userId) {
        return PersonalTransaction.findOne({ _id: id, createdBy: userId }).populate("category account");
    }
    async findAll(userId) {
        return PersonalTransaction.find({ createdBy: userId })
            .populate("category account")
            .sort({ date: -1 });
    }
    async update(id, userId, updateData) {
        return PersonalTransaction.findOneAndUpdate({ _id: id, createdBy: userId }, { $set: updateData }, { new: true, runValidators: true }).populate("category account");
    }
    async delete(id, userId) {
        return PersonalTransaction.findOneAndDelete({ _id: id, createdBy: userId });
    }
    async getStats(userId, startDate, endDate) {
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
};
PersonalTransactionRepository = __decorate([
    injectable(),
    singleton()
], PersonalTransactionRepository);
export { PersonalTransactionRepository };
import mongoose from "mongoose";
