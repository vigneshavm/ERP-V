var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { injectable, singleton } from "tsyringe";
import Expense from '@smarterp/core/modules/expense/models/Expense.js';
let ExpenseRepository = class ExpenseRepository {
    async create(expenseData) {
        return Expense.create(expenseData);
    }
    async findById(id, userId) {
        return Expense.findOne({ _id: id, createdBy: userId });
    }
    async findByExpenseNo(expenseNo, userId) {
        return Expense.findOne({ expenseNo, createdBy: userId });
    }
    async findByExpenseNoExcludingId(expenseNo, userId, excludeId) {
        return Expense.findOne({ expenseNo, createdBy: userId, _id: { $ne: excludeId } });
    }
    async findAll(userId) {
        return Expense.find({ createdBy: userId }).sort({ createdAt: -1 });
    }
    async update(id, userId, updateData) {
        return Expense.findOneAndUpdate({ _id: id, createdBy: userId }, { $set: updateData }, { new: true, runValidators: true });
    }
    async delete(id, userId) {
        return Expense.findOneAndDelete({ _id: id, createdBy: userId });
    }
};
ExpenseRepository = __decorate([
    injectable(),
    singleton()
], ExpenseRepository);
export { ExpenseRepository };
