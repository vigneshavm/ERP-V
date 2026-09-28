import { injectable, inject } from "tsyringe";
import { CashBankRepository } from "../repositories/CashBankRepository.js";
import { AppError } from "../../../utils/AppError.js";
import { ICashbankTransaction } from "../../../interfaces/ICashbankTransaction.js";
import { info } from "../../../config/logger.js";
import mongoose from "mongoose";
import type { IdRef } from "../../../interfaces/TenantRef.js";

@injectable()
export class CashBankService {
    constructor(
        @inject(CashBankRepository) private cashBankRepository: CashBankRepository
    ) { }

    // Account Logic
    async getAccounts(tenantId: string): Promise<any[]> {
        const accounts = await this.cashBankRepository.getAccounts(tenantId);
        return accounts.map(acc => ({
            ...acc.toObject(),
            accountNumber: acc.getDecryptedAccountNumber()
        }));
    }

    async createAccount(data: any, tenantId: string, userId: string, userName: string): Promise<any> {
        const { bankName, accountNumber, accountType, branch, ifsc, openingBalance } = data;

        if (!bankName || !accountNumber || !ifsc) {
            throw new AppError("Please fill all required fields", 400);
        }

        const existing = await this.cashBankRepository.findAccountByNumber(accountNumber, tenantId);
        if (existing) {
            throw new AppError("Account already exists", 400);
        }

        const account = await this.cashBankRepository.createAccount({
            bankName,
            accountNumber,
            accountType,
            branch,
            ifsc,
            openingBalance: openingBalance || 0,
            currentBalance: openingBalance || 0,
            userId,
        }, tenantId);

        info(`Bank account added by ${userName}: ${account.bankName}`);

        return {
            ...account.toObject(),
            accountNumber: account.getDecryptedAccountNumber()
        };
    }

    async updateAccount(id: string, tenantId: string, data: any, userName: string): Promise<any> {
        const account = await this.cashBankRepository.findAccountById(id, tenantId);
        if (!account) throw new AppError("Account not found", 404);

        if (data.currentBalance !== undefined) delete data.currentBalance; // Prevent balance modification directly

        const updated = await this.cashBankRepository.updateAccount(id, tenantId, data);
        if (!updated) throw new AppError("Update failed", 500);

        info(`Bank account updated by ${userName}: ${updated.bankName}`);
        return {
            ...updated.toObject(),
            accountNumber: updated.getDecryptedAccountNumber()
        };
    }

    async deleteAccount(id: string, tenantId: string, userName: string): Promise<void> {
        const count = await this.cashBankRepository.countTransactions(id, tenantId);
        if (count > 0) {
            throw new AppError(`Cannot delete bank account with existing transactions (${count}).`, 400);
        }

        const deleted = await this.cashBankRepository.deleteAccount(id, tenantId);
        if (!deleted) throw new AppError("Account not found", 404);

        info(`Bank account deleted by ${userName}: ${deleted.bankName}`);
    }

    // Transaction Logic
    async getTransactions(id: string, tenantId: string): Promise<ICashbankTransaction[]> {
        return this.cashBankRepository.getTransactions(tenantId, id);
    }

    async getAllTransactions(tenantId: string): Promise<ICashbankTransaction[]> {
        return this.cashBankRepository.getTransactions(tenantId);
    }

    async createTransfer(data: any, tenantId: string, userId: string, userName: string): Promise<ICashbankTransaction> {
        const { fromAccount, toAccount, amount, description } = data;

        if (!fromAccount || !toAccount || !amount) throw new AppError("Invalid transfer data", 400);
        if (fromAccount === toAccount) throw new AppError("Source and destination cannot be same", 400);

        // Validation
        if (fromAccount !== 'cash') {
            const acc = await this.cashBankRepository.findAccountById(fromAccount, tenantId);
            if (!acc) throw new AppError("Source account not found", 404);
            if (acc.currentBalance < amount) throw new AppError("Insufficient balance in source account", 400);
        } else {
            const cashBal = await this.cashBankRepository.getCashBalance(tenantId);
            if (cashBal < amount) throw new AppError(`Insufficient cash. Available: ${cashBal}`, 400);
        }

        const txn = await this.cashBankRepository.createTransaction({
            type: 'transfer',
            amount,
            fromAccount,
            toAccount,
            description,
            userId,
            date: new Date()
        }, tenantId);

        // Update Balances
        if (fromAccount !== 'cash') await this.cashBankRepository.updateBalance(fromAccount, tenantId, -amount);
        if (toAccount !== 'cash') await this.cashBankRepository.updateBalance(toAccount, tenantId, amount);

        info(`Transfer by ${userName}: ${amount} from ${fromAccount} to ${toAccount}`);
        return txn;
    }

    async createCashTransaction(data: any, tenantId: string, userId: string, userName: string): Promise<ICashbankTransaction> {
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
                const bank = await this.cashBankRepository.findAccountById(otherAccount, tenantId);
                if (!bank) throw new AppError("Bank not found", 404);
                if (bank.currentBalance < amount) throw new AppError("Insufficient bank balance", 400);
            } else { // Cash -> Bank
                const cashBal = await this.cashBankRepository.getCashBalance(tenantId);
                if (cashBal < amount) throw new AppError("Insufficient cash", 400);
            }
        }

        const txn = await this.cashBankRepository.createTransaction({
            type: isBankTransfer ? 'transfer' : type,
            amount,
            fromAccount,
            toAccount,
            description,
            reference,
            date: date || new Date(),
            userId
        }, tenantId);

        if (isBankTransfer) {
            if (type === 'in') await this.cashBankRepository.updateBalance(otherAccount, tenantId, -amount);
            else await this.cashBankRepository.updateBalance(otherAccount, tenantId, amount);
        }

        info(`Cash ${type} by ${userName}: ${amount}`);
        return txn;
    }

    // Ledger & Reports
    async getLedger(accountId: string, tenantId: string, queryParams: any): Promise<any> {
        const { startDate, endDate, reconciled } = queryParams;
        const query: any = {
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
            const balance = await this.cashBankRepository.getCashBalance(tenantId);
            account = {
                _id: 'cash',
                bankName: 'Cash in Hand',
                accountNumber: 'CASH-ACCOUNT',
                openingBalance: 0,
                currentBalance: balance,
                getDecryptedAccountNumber: () => 'CASH-ACCOUNT'
            };
        } else {
            const acc = await this.cashBankRepository.findAccountById(accountId, tenantId);
            if (!acc) throw new AppError("Account not found", 404);
            account = {
                ...acc.toObject(),
                accountNumber: acc.getDecryptedAccountNumber()
            };
        }

        // Period Opening Balance Calculation
        let periodOpeningBalance = account.openingBalance || 0;
        if (startDate) {
            const priorTxns = await this.cashBankRepository.queryTransactions(tenantId, {
                date: { $lt: new Date(startDate) },
                $or: [{ fromAccount: accountId }, { toAccount: accountId }]
            }, {});

            priorTxns.forEach(t => {
                const isMoneyIn = t.toAccount.toString() === accountId;
                periodOpeningBalance += isMoneyIn ? t.amount : -t.amount;
            });
        }

        const transactions = await this.cashBankRepository.queryTransactions(tenantId, query);
        let runningBalance = periodOpeningBalance;

        const ledger = transactions.map(txn => {
            const isCredit = txn.toAccount.toString() === accountId;
            const amount = isCredit ? txn.amount : -txn.amount;
            runningBalance += amount;
            return {
                ...txn,
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

    async toggleReconciliation(id: string, tenantId: string, userId: string): Promise<any> {
        const txn = await this.cashBankRepository.findTransactionById(id, tenantId);
        if (!txn) throw new AppError("Transaction not found", 404);

        const newState = !txn.reconciled;
        const updated = await this.cashBankRepository.updateTransaction(id, tenantId, {
            reconciled: newState,
            reconciledDate: newState ? new Date() : undefined,
            reconciledBy: newState ? new mongoose.Types.ObjectId(userId) : undefined
        });

        return updated;
    }

    async bulkReconcile(ids: string[], tenantId: string, userId: string, reconciled: boolean): Promise<any> {
        const result = await this.cashBankRepository.updateManyTransactions(ids, tenantId, {
            reconciled,
            reconciledDate: reconciled ? new Date() : undefined,
            reconciledBy: reconciled ? new mongoose.Types.ObjectId(userId) : undefined
        });
        return result;
    }

    async getBankSummary(tenantId: string): Promise<any> {
        const accounts = await this.cashBankRepository.getAccounts(tenantId);
        const totalBalance = accounts.reduce((acc, curr) => acc + curr.currentBalance, 0);

        return {
            totalAccounts: accounts.length,
            totalBalance,
            accounts: accounts.map((acc: any) => ({
                id: acc._id,
                bankName: acc.bankName,
                accountNumber: acc.getDecryptedAccountNumber(),
                currentBalance: acc.currentBalance,
                accountType: acc.accountType
            }))
        };
    }

    async getPosition(tenantId: string): Promise<any> {
        const accounts = await this.cashBankRepository.getAccounts(tenantId);
        const totalBank = accounts.reduce((s, a) => s + a.currentBalance, 0);
        const cashInHand = await this.cashBankRepository.getCashBalance(tenantId);
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

    async validatePayments(payments: any[], tenantId: string): Promise<{ valid: boolean; errors: string[] }> {
        const errors: string[] = [];
        for (const p of payments) {
            if (p.paymentMethod === 'bank_transfer' && p.bankAccountId) {
                const acc = await this.cashBankRepository.findAccountById(p.bankAccountId, tenantId);
                if (!acc) errors.push(`Account not found for payment: ${p.amount}`);
                else if (acc.currentBalance < p.amount) errors.push(`Insufficient balance in ${acc.bankName} for payment ${p.amount}`);
            }
        }
        return { valid: errors.length === 0, errors };
    }

    // Purchase-return refunds
    async recordPurchaseReturnRefund(input: {
        refundMethod: string;
        bankAccountId?: IdRef | null;
        amount: number;
        returnId: string;
        userId: IdRef;
        tenantId: string;
    }): Promise<void> {
        const { refundMethod, bankAccountId, amount, returnId, userId, tenantId } = input;
        if (refundMethod === "bank_transfer" && bankAccountId) {
            const bankAcc = await this.cashBankRepository.findAccountById(bankAccountId.toString(), tenantId);
            if (!bankAcc) return;
            await this.cashBankRepository.createTransaction({
                type: "in",
                amount,
                toAccount: bankAccountId,
                fromAccount: "purchase_return",
                description: `Refund for purchase return ${returnId}`,
                date: new Date(),
                userId: userId.toString(),
            }, tenantId);
            await this.cashBankRepository.updateBalance(bankAccountId.toString(), tenantId, amount);
        } else if (refundMethod === "cash") {
            await this.cashBankRepository.createTransaction({
                type: "in",
                amount,
                toAccount: "cash",
                fromAccount: "purchase_return",
                description: `Cash refund for purchase return ${returnId}`,
                date: new Date(),
                userId: userId.toString(),
            }, tenantId);
        }
    }

    async reversePurchaseReturnBankRefund(input: { bankAccountId: IdRef; amount: number; returnId: string; userId: IdRef; tenantId: string }): Promise<void> {
        const { bankAccountId, amount, tenantId } = input;
        const bankAcc = await this.cashBankRepository.findAccountById(bankAccountId.toString(), tenantId);
        if (!bankAcc) return;

        await this.cashBankRepository.updateBalance(bankAccountId.toString(), tenantId, -amount);
    }
}
