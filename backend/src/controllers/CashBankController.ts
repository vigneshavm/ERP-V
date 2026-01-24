import { Request, Response, NextFunction } from "express";
import { autoInjectable } from "tsyringe";
import { CashBankService } from "../services/CashBankService.js";

@autoInjectable()
export class CashBankController {
    constructor(private cashBankService: CashBankService) { }

    getAccounts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const accounts = await this.cashBankService.getAccounts(userId);
            res.status(200).json(accounts);
        } catch (error) {
            next(error);
        }
    }

    createAccount = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;
            const result = await this.cashBankService.createAccount(req.body, userId, userName);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    updateAccount = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;
            const result = await this.cashBankService.updateAccount(req.params.id as string, userId, req.body, userName);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;
            await this.cashBankService.deleteAccount(req.params.id as string, userId, userName);
            res.status(200).json({ message: "Account deleted successfully" });
        } catch (error) {
            next(error);
        }
    }

    getTransactions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const transactions = await this.cashBankService.getTransactions(req.params.id as string, userId);
            res.status(200).json(transactions);
        } catch (error) {
            next(error);
        }
    }

    createTransfer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;
            const result = await this.cashBankService.createTransfer(req.body, userId, userName);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    createCashTransaction = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const userName = (req as any).user.name;
            const result = await this.cashBankService.createCashTransaction(req.body, userId, userName);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    getLedger = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const result = await this.cashBankService.getLedger(req.params.id as string, userId, req.query);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    toggleReconciliation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const result = await this.cashBankService.toggleReconciliation(req.params.id as string, userId);
            res.status(200).json({ message: "Reconciliation updated", transaction: result });
        } catch (error) {
            next(error);
        }
    }

    bulkReconcile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { transactionIds, reconciled } = req.body;
            const userId = (req as any).user._id;
            const result = await this.cashBankService.bulkReconcile(transactionIds, userId, reconciled);
            res.status(200).json({ message: "Transactions updated", modifiedCount: result.modifiedCount });
        } catch (error) {
            next(error);
        }
    }

    getPosition = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            const result = await this.cashBankService.getPosition(userId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    getBankSummary = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).user._id;
            // Reusing getPosition or logic from service designed for summary? 
            // Original code had specific summary logic (list all accounts with simplified fields).
            // Let's implement specific summary in service or reuse repository accounts.
            // Service.getAccounts already returns formatted list. Summary just needs aggregation.
            // For now, let's map from getAccounts to match expected summary structure or add explicit method.
            // Adding explicit method to service is cleaner.
            // For expedienc in this step, I will reuse getAccounts and simple calc in controller or add logic to service in next refinement if needed.
            // Actually, let's just use getAccounts which returns full data, front end likely filters it.
            // Re-reading original `getBankSummary`: returns { accounts: [], totalBalance, accountCount }.
            // I should implement `getBankSummary` in Service.
            // I'll add the method to Controller now and Service call, assuming I added it or will add it.
            // Wait, I missed adding explicit `getBankSummary` to Service in previous step.
            // I will implement it here inline or assume `getPosition` covers it?
            // `getPosition` covers aggregates. `getAccounts` covers list.
            // I will combine them here or add a specific service method.
            // Let's add a specific service method in next update or now.
            // I can't edit previous file now. I will use `getAllAccounts` and map it here.
            const accounts = await this.cashBankService.getAccounts(userId);
            const totalBalance = accounts.reduce((sum: number, acc: any) => sum + (acc.currentBalance || 0), 0);

            res.status(200).json({
                accounts: accounts.map(acc => ({
                    _id: acc._id,
                    bankName: acc.bankName,
                    accountType: acc.accountType,
                    accountNumber: acc.accountNumber, // Decrypted
                    openingBalance: acc.openingBalance,
                    currentBalance: acc.currentBalance,
                    status: acc.status
                })),
                totalBalance,
                accountCount: accounts.length
            });
        } catch (error) {
            next(error);
        }
    }
}
