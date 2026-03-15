import { injectable, singleton } from "tsyringe";
import Expense from '@smarterp/core/modules/expense/models/Expense.js';
import { IExpense } from '@smarterp/shared/interfaces/IExpense.js';

@injectable()
@singleton()
export class ExpenseRepository {
    async create(expenseData: Partial<IExpense>): Promise<IExpense> {
        return Expense.create(expenseData);
    }

    async findById(id: string, userId: string): Promise<IExpense | null> {
        return Expense.findOne({ _id: id, createdBy: userId });
    }

    async findByExpenseNo(expenseNo: string, userId: string): Promise<IExpense | null> {
        return Expense.findOne({ expenseNo, createdBy: userId });
    }

    async findByExpenseNoExcludingId(expenseNo: string, userId: string, excludeId: string): Promise<IExpense | null> {
        return Expense.findOne({ expenseNo, createdBy: userId, _id: { $ne: excludeId } });
    }

    async findAll(userId: string): Promise<IExpense[]> {
        return Expense.find({ createdBy: userId }).sort({ createdAt: -1 });
    }

    async update(id: string, userId: string, updateData: Partial<IExpense>): Promise<IExpense | null> {
        return Expense.findOneAndUpdate(
            { _id: id, createdBy: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );
    }

    async delete(id: string, userId: string): Promise<IExpense | null> {
        return Expense.findOneAndDelete({ _id: id, createdBy: userId });
    }
}
