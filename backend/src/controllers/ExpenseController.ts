import { Request, Response, NextFunction } from "express";
import { autoInjectable } from "tsyringe";
import { ExpenseService } from "../services/ExpenseService.js";

@autoInjectable()
export class ExpenseController {
    constructor(private expenseService: ExpenseService) { }

    getAllExpenses = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const expenses = await this.expenseService.getAllExpenses(userId);
            res.status(200).json(expenses);
        } catch (error) {
            next(error);
        }
    }

    createExpense = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const result = await this.expenseService.createExpense(req.body, userId);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    getExpenseById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const expense = await this.expenseService.getExpenseById(req.params.id as string, userId);
            res.status(200).json(expense);
        } catch (error) {
            next(error);
        }
    }

    updateExpense = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const result = await this.expenseService.updateExpense(req.params.id as string, userId, req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            await this.expenseService.deleteExpense(req.params.id as string, userId);
            res.status(200).json({ message: "Expense deleted" });
        } catch (error) {
            next(error);
        }
    }
}
