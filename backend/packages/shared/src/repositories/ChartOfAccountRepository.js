var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable, singleton } from "tsyringe";
import ChartOfAccount from '@smarterp/core/modules/finance/models/ChartOfAccount.js';
import mongoose from "mongoose";
let ChartOfAccountRepository = class ChartOfAccountRepository {
    async findAll(tenantId) {
        return ChartOfAccount.find({ tenantId: new mongoose.Types.ObjectId(tenantId) }).sort({ code: 1 });
    }
    async findById(id, tenantId) {
        return ChartOfAccount.findOne({ _id: new mongoose.Types.ObjectId(id), tenantId: new mongoose.Types.ObjectId(tenantId) });
    }
    async findByCode(code, tenantId) {
        return ChartOfAccount.findOne({ code, tenantId: new mongoose.Types.ObjectId(tenantId) });
    }
    async create(data) {
        return ChartOfAccount.create(data);
    }
    async update(id, tenantId, data) {
        return ChartOfAccount.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(id), tenantId: new mongoose.Types.ObjectId(tenantId) }, { $set: data }, { new: true });
    }
    async delete(id, tenantId) {
        return ChartOfAccount.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(id),
            tenantId: new mongoose.Types.ObjectId(tenantId),
            isSystem: false // Don't delete system accounts
        });
    }
    async updateBalance(id, amount) {
        await ChartOfAccount.updateOne({ _id: id }, { $inc: { currentBalance: amount } });
    }
};
ChartOfAccountRepository = __decorate([
    injectable(),
    singleton()
], ChartOfAccountRepository);
export { ChartOfAccountRepository };
