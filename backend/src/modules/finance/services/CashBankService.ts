import { injectable, inject } from "tsyringe";
import { CashBankRepository } from "../../../repositories/CashBankRepository.js";
import { AppError } from "../../../utils/AppError.js";
// import { IBankAccount } from "../../../interfaces/IBankAccount.js";
import { ICashbankTransaction } from "../../../interfaces/ICashbankTransaction.js";
import { info } from "../../../config/logger.js";
import mongoose from "mongoose";

@injectable()
export class CashBankService {
    constructor(
        @inject(CashBankRepository) private cashBankRepository: CashBankRepository
    ) { }

    // Account Logic
    async getAccounts(userId: string): Promise<any[]> {
        const accounts = await this.cashBankRepository.getAccounts(userId);
        return accounts.map(acc => ({
            ...acc.toObject(),
            accountNumber: acc.getDecryptedAccountNumber()
        }));
    }

    async createAccount(data: any, userId: string, userName: string): Promise<any> {
        const { bankName, accountNumber, accountType, branch, ifsc, openingBalance } = data;

        if (!bankName || !accountNumber || !ifsc) {
            throw new AppError("Please fill all required fields", 400);
        }

        const existing = await this.cashBankRepository.findAccountByNumber(accountNumber, userId);
        if (existing) {
            throw new AppError("Account already exists", 400);
        }

        const account = await this.cashBankRepository.createAccount({
            bankName, accountNumber, accountType, branch, ifsc,
            openingBalance, currentBalance: openingBalance, userId
        });

        info(`Bank account added by ${userName}: ${account.bankName}`);

        return {
            ...account.toObject(),
            accountNumber: account.getDecryptedAccountNumber()
        };
    }

    async updateAccount(id: string, userId: string, data: any, userName: string): Promise<any> {
        const account = await this.cashBankRepository.findAccountById(id, userId);
        if (!account) throw new AppError("Account not found", 404);

        if (data.currentBalance) delete data.currentBalance; // Prevent balance hack

        const updated = await this.cashBankRepository.updateAccount(id, userId, data);
        if (!updated) throw new AppError("Update failed", 500);

        info(`Bank account updated by ${userName}: ${updated.bankName}`);
        return {
            ...updated.toObject(),
            accountNumber: updated.getDecryptedAccountNumber()
        };
    }

    async deleteAccount(id: string, userId: string, userName: string): Promise<void> {
        const count = await this.cashBankRepository.countTransactions(id);
        if (count > 0) {
            throw new AppError(`Cannot delete bank account with existing transactions (${count}).`, 400);
        }

        const deleted = await this.cashBankRepository.deleteAccount(id, userId);
        if (!deleted) throw new AppError("Account not found", 404);

        info(`Bank account deleted by ${userName}: ${deleted.bankName}`);
    }

    // Transaction Logic
    async getTransactions(id: string, userId: string): Promise<ICashbankTransaction[]> {
        return this.cashBankRepository.getTransactions(userId, id);
    }

    async createTransfer(data: any, userId: string, userName: string): Promise<ICashbankTransaction> {
        const { fromAccount, toAccount, amount, description } = data;

        if (!fromAccount || !toAccount || !amount) throw new AppError("Invalid transfer data", 400);
        if (fromAccount === toAccount) throw new AppError("Source and destination cannot be same", 400);

        // Validation
        if (fromAccount !== 'cash') {
            const acc = await this.cashBankRepository.findAccountById(fromAccount, userId);
            if (!acc) throw new AppError("Source account not found", 404);
            if (acc.currentBalance < amount) throw new AppError("Insufficient balance in source account", 400);
        } else {
            const cashBal = await this.cashBankRepository.getCashBalance(userId);
            if (cashBal < amount) throw new AppError(`Insufficient cash. Available: ${cashBal}`, 400);
        }

        const txn = await this.cashBankRepository.createTransaction({
            type: 'transfer', amount, fromAccount, toAccount, description, userId, date: new Date()
        });

        // Update Balances
        if (fromAccount !== 'cash') await this.cashBankRepository.updateBalance(fromAccount, -amount);
        if (toAccount !== 'cash') await this.cashBankRepository.updateBalance(toAccount, amount);

        info(`Transfer by ${userName}: ${amount} from ${fromAccount} to ${toAccount}`);
        return txn;
    }

    async createCashTransaction(data: any, userId: string, userName: string): Promise<ICashbankTransaction> {
        const { type, amount, otherAccount, description, reference, date } = data;
        if (!type || !amount || !otherAccount) throw new AppError("Missing fields", 400);

        let fromAccount, toAccount;
        if (type === 'in') {
            fromAccount = otherAccount;
            toAccount = 'cash';
        } else {
            fromAccount = 'cash';
            toAccount = otherAccount;
        }

        const isBankTransfer = mongoose.Types.ObjectId.isValid(otherAccount);

        if (isBankTransfer) {
            if (type === 'in') { // Bank -> Cash
                const bank = await this.cashBankRepository.findAccountById(otherAccount, userId);
                if (!bank) throw new AppError("Bank not found", 404);
                if (bank.currentBalance < amount) throw new AppError("Insufficient bank balance", 400);
            } else { // Cash -> Bank
                const cashBal = await this.cashBankRepository.getCashBalance(userId);
                if (cashBal < amount) throw new AppError("Insufficient cash", 400);
            }
        }

        const txn = await this.cashBankRepository.createTransaction({
            type: isBankTransfer ? 'transfer' : type,
            amount, fromAccount, toAccount, description, reference, date: date || new Date(), userId
        });

        if (isBankTransfer) {
            if (type === 'in') await this.cashBankRepository.updateBalance(otherAccount, -amount);
            else await this.cashBankRepository.updateBalance(otherAccount, amount);
        }

        info(`Cash ${type} by ${userName}: ${amount}`);
        return txn;
    }

    // Ledger & Reports
    async getLedger(accountId: string, userId: string, queryParams: any): Promise<any> {
        const { startDate, endDate, reconciled } = queryParams;
        const query: any = {
            userId,
            $or: [{ fromAccount: accountId }, { toAccount: accountId }]
        };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        if (reconciled !== undefined) query.reconciled = reconciled === 'true';

        // Account Details (or Cash)
        let account: any;
        if (accountId === 'cash') {
            const balance = await this.cashBankRepository.getCashBalance(userId);
            account = {
                _id: 'cash', bankName: 'Cash in Hand', accountNumber: 'CASH-ACCOUNT',
                openingBalance: 0, currentBalance: balance, getDecryptedAccountNumber: () => 'CASH-ACCOUNT'
            };
        } else {
            const acc = await this.cashBankRepository.findAccountById(accountId, userId);
            if (!acc) throw new AppError("Account not found", 404);
            account = {
                ...acc.toObject(),
                accountNumber: acc.getDecryptedAccountNumber()
            };
        }

        // Period Opening Balance Calculation
        let periodOpeningBalance = account.openingBalance || 0;
        if (startDate) {
            const priorTxns = await this.cashBankRepository.queryTransactions({
                userId,
                date: { $lt: new Date(startDate) },
                $or: [{ fromAccount: accountId }, { toAccount: accountId }]
            }, {}); // No sort needed for sum

            priorTxns.forEach(t => {
                const isMoneyIn = t.toAccount.toString() === accountId;
                periodOpeningBalance += isMoneyIn ? t.amount : -t.amount;
            });
        }

        const transactions = await this.cashBankRepository.queryTransactions(query);
        let runningBalance = periodOpeningBalance;

        const ledger = transactions.map(txn => {
            const isCredit = txn.toAccount.toString() === accountId;
            const amount = isCredit ? txn.amount : -txn.amount;
            runningBalance += amount;
            return {
                ...txn, // already lean
                debit: !isCredit ? txn.amount : 0,
                credit: isCredit ? txn.amount : 0,
                runningBalance,
                transactionType: isCredit ? 'credit' : 'debit'
            };
        });

        return {
            account,
            ledger,
            summary: {
                openingBalance: periodOpeningBalance,
                totalCredits: ledger.reduce((s, t) => s + t.credit, 0),
                totalDebits: ledger.reduce((s, t) => s + t.debit, 0),
                closingBalance: runningBalance
            }
        };
    }

    async toggleReconciliation(id: string, userId: string): Promise<any> {
        const txn = await this.cashBankRepository.findTransactionById(id, userId);
        if (!txn) throw new AppError("Transaction not found", 404);

        const newState = !txn.reconciled;
        const updated = await this.cashBankRepository.updateTransaction(id, userId, {
            reconciled: newState,
            reconciledDate: newState ? new Date() : undefined,
            reconciledBy: newState ? userId : undefined
        });

        return updated;
    }

    async bulkReconcile(ids: string[], userId: string, reconciled: boolean): Promise<any> {
        const result = await this.cashBankRepository.updateManyTransactions(ids, userId, {
            reconciled,
            reconciledDate: reconciled ? new Date() : undefined,
            reconciledBy: reconciled ? userId : undefined
        });
        return result;
    }

    async getPosition(userId: string): Promise<any> {
        const accounts = await this.cashBankRepository.getAccounts(userId);
        const totalBank = accounts.reduce((s, a) => s + a.currentBalance, 0);
        const cashInHand = await this.cashBankRepository.getCashBalance(userId);
        const totalLiquidity = totalBank + cashInHand;

        return {
            cashInHand,
            totalBankBalance: totalBank,
            totalLiquidity,
            breakdown: {
                cash: { amount: cashInHand, percentage: totalLiquidity ? ((cashInHand / totalLiquidity) * 100).toFixed(2) : 0 },
                bank: { amount: totalBank, percentage: totalLiquidity ? ((totalBank / totalLiquidity) * 100).toFixed(2) : 0, accounts: accounts.length }
            }
        };
    }
}
