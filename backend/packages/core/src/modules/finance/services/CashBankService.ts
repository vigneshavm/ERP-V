import { injectable, inject } from "tsyringe";
import { CashBankRepository } from '../repositories/CashBankRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import type { IBankAccount } from '@smarterp/shared/interfaces/IBankAccount.js';
import { ICashbankTransaction } from '@smarterp/shared/interfaces/ICashbankTransaction.js';
import { ICheque } from '@smarterp/shared/interfaces/ICheque.js';
import { info } from '@smarterp/shared/config/logger.js';
import { ObjectId } from "mongodb";
import { invalidateUserCache } from '@smarterp/shared/config/cache.js';

@injectable()
export class CashBankService {
    constructor(
        @inject(CashBankRepository) private cashBankRepository: CashBankRepository
    ) { }

    private async invalidateFinanceCache(userId: string): Promise<void> {
        await invalidateUserCache(userId, '/api/finance*');
        await invalidateUserCache(userId, '/api/reports*');
    }

    // Account Logic
    async getAccounts(userId: string): Promise<IBankAccount[]> {
        const accounts = await this.cashBankRepository.getAccounts(userId);
        return accounts.map(acc => ({
            ...acc,
            accountNumber: this.cashBankRepository.decryptAccountNumber(acc.accountNumber)
        }));
    }

    async createAccount(data: any, userId: string, userName: string): Promise<IBankAccount> {
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
        
        await this.invalidateFinanceCache(userId);

        return {
            ...account,
            accountNumber: this.cashBankRepository.decryptAccountNumber(account.accountNumber)
        };
    }

    async updateAccount(id: string, userId: string, data: any, userName: string): Promise<any> {
        const account = await this.cashBankRepository.findAccountById(id, userId);
        if (!account) throw new AppError("Account not found", 404);

        if (data.currentBalance) delete data.currentBalance; // Prevent balance hack

        const updated = await this.cashBankRepository.updateAccount(id, userId, data);
        if (!updated) throw new AppError("Update failed", 500);

        info(`Bank account updated by ${userName}: ${updated.bankName}`);
        
        await this.invalidateFinanceCache(userId);
        return {
            ...updated,
            accountNumber: this.cashBankRepository.decryptAccountNumber(updated.accountNumber)
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
        
        await this.invalidateFinanceCache(userId);
    }

    // Transaction Logic
    async getTransactions(id: string, userId: string): Promise<ICashbankTransaction[]> {
        return this.cashBankRepository.getTransactions(userId, id);
    }

    async createTransfer(data: any, userId: string, userName: string): Promise<ICashbankTransaction> {
        const { fromAccount, toAccount, amount, description } = data;

        if (!fromAccount || !toAccount || !amount) throw new AppError("Invalid transfer data", 400);
        if (fromAccount === toAccount) throw new AppError("Source and destination cannot be same", 400);

        return this.cashBankRepository.executeInTransaction(async (session) => {
            // Validation
            if (fromAccount !== 'cash') {
                const acc = await this.cashBankRepository.findAccountById(fromAccount, userId, session);
                if (!acc) throw new AppError("Source account not found", 404);
                if (acc.currentBalance < amount) throw new AppError("Insufficient balance in source account", 400);
            } else {
                const cashBal = await this.cashBankRepository.getCashBalance(userId, session);
                if (cashBal < amount) throw new AppError(`Insufficient cash. Available: ${cashBal}`, 400);
            }

            const txn = await this.cashBankRepository.createTransaction({
                type: 'transfer', amount, fromAccount, toAccount, description, userId, date: new Date()
            }, session);

            // Update Balances
            if (fromAccount !== 'cash') await this.cashBankRepository.updateBalance(fromAccount, -amount, session);
            if (toAccount !== 'cash') await this.cashBankRepository.updateBalance(toAccount, amount, session);

            info(`Transfer by ${userName}: ${amount} from ${fromAccount} to ${toAccount}`);
            
            await this.invalidateFinanceCache(userId);
            
            return txn;
        });
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

        const isBankTransfer = ObjectId.isValid(otherAccount);

        return this.cashBankRepository.executeInTransaction(async (session) => {
            if (isBankTransfer) {
                if (type === 'in') { // Bank -> Cash
                    const bank = await this.cashBankRepository.findAccountById(otherAccount, userId, session);
                    if (!bank) throw new AppError("Bank not found", 404);
                    if (bank.currentBalance < amount) throw new AppError("Insufficient bank balance", 400);
                } else { // Cash -> Bank
                    const cashBal = await this.cashBankRepository.getCashBalance(userId, session);
                    if (cashBal < amount) throw new AppError("Insufficient cash", 400);
                }
            }

            const txn = await this.cashBankRepository.createTransaction({
                type: isBankTransfer ? 'transfer' : type,
                amount, fromAccount, toAccount, description, reference, date: date || new Date(), userId
            }, session);

            if (isBankTransfer) {
                if (type === 'in') await this.cashBankRepository.updateBalance(otherAccount, -amount, session);
                else await this.cashBankRepository.updateBalance(otherAccount, amount, session);
            }

            info(`Cash ${type} by ${userName}: ${amount}`);
            
            await this.invalidateFinanceCache(userId);
            
            return txn;
        });
    }

    // Ledger & Reports
    async getLedger(accountId: string, userId: string, queryParams: any): Promise<any> {
        const { startDate, endDate, reconciled } = queryParams;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const isReconciled = reconciled !== undefined ? reconciled === 'true' : undefined;

        // Account Details (or Cash)
        let account: any;
        if (accountId === 'cash') {
            const balance = await this.cashBankRepository.getCashBalance(userId);
            account = {
                _id: 'cash', bankName: 'Cash in Hand', accountNumber: 'CASH-ACCOUNT',
                openingBalance: 0, currentBalance: balance
            };
        } else {
            const acc = await this.cashBankRepository.findAccountById(accountId, userId);
            if (!acc) throw new AppError("Account not found", 404);
            account = {
                ...acc,
                accountNumber: this.cashBankRepository.decryptAccountNumber(acc.accountNumber)
            };
        }

        // Period Opening Balance Calculation
        let periodOpeningBalance = account.openingBalance || 0;
        if (start) {
            periodOpeningBalance += await this.cashBankRepository.getPriorTransactionsSum(accountId, userId, start);
        }

        const transactions = await this.cashBankRepository.getLedgerTransactions(accountId, userId, start, end, isReconciled);
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

    async toggleReconciliation(id: string, userId: string): Promise<any> {
        const txn = await this.cashBankRepository.findTransactionById(id, userId);
        if (!txn) throw new AppError("Transaction not found", 404);

        const newState = !txn.reconciled;
        const updated = await this.cashBankRepository.updateTransaction(id, userId, {
            reconciled: newState,
            reconciledDate: newState ? new Date() : undefined,
            reconciledBy: newState ? userId : undefined
        });

        await this.invalidateFinanceCache(userId);

        return updated;
    }

    async bulkReconcile(ids: string[], userId: string, reconciled: boolean): Promise<any> {
        const result = await this.cashBankRepository.updateManyTransactions(ids, userId, {
            reconciled,
            reconciledDate: reconciled ? new Date() : undefined,
            reconciledBy: reconciled ? userId : undefined
        });
        await this.invalidateFinanceCache(userId);
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

    async getBankSummary(userId: string): Promise<{ accounts: IBankAccount[], totalBalance: number, accountCount: number }> {
        const accounts = await this.cashBankRepository.getAccounts(userId);
        const totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
        const accountCount = accounts.length;

        const decryptedAccounts = accounts.map(acc => ({
            ...acc,
            accountNumber: this.cashBankRepository.decryptAccountNumber(acc.accountNumber)
        }));

        return { accounts: decryptedAccounts, totalBalance, accountCount };
    }

    async validatePayments(accountId: string, payments: any[], userId: string): Promise<any> {
        const account = await this.cashBankRepository.findAccountById(accountId, userId);
        if (!account) throw new AppError('Account not found', 404);

        const allPendingIssued = await this.cashBankRepository.getPendingIssuedCheques(accountId, userId);

        const totalPDCValue = allPendingIssued.reduce((sum, c) => sum + c.amount, 0);
        const effectiveBalance = account.currentBalance - totalPDCValue;

        const results = payments.map((p: any) => ({
            ...p,
            status: effectiveBalance >= p.amount ? 'approved' : 'insufficient_funds',
            shortage: effectiveBalance >= p.amount ? 0 : p.amount - effectiveBalance
        }));

        return {
            openingBalance: account.currentBalance,
            effectiveBalance,
            results,
            approved: results.every((r: any) => r.status === 'approved')
        };
    }

    async getCheques(userId: string, sector?: string): Promise<any> {
        const query: any = { userId };
        if (sector) query.sector = sector;
        return this.cashBankRepository.queryCheques(query, { date: 1 });
    }

    async createCheque(data: any, userId: string, tenantId: string, userName: string): Promise<any> {
        const { number, payee, amount, date, bankName, type, accountId, sector, notes, forcePay } = data;

        if (type === 'ISSUED') {
            const account = await this.cashBankRepository.findAccountById(accountId, userId);
            if (!account) throw new AppError('Account not found', 404);

            const targetDate = new Date(date);
            const pendingIssuedCheques = await this.cashBankRepository.getPendingIssuedCheques(accountId, userId, targetDate);

            const totalPDCValue = pendingIssuedCheques.reduce((sum, c) => sum + c.amount, 0);
            const effectiveBalance = account.currentBalance - totalPDCValue;

            if (effectiveBalance < amount && !forcePay) {
                throw new AppError('Insufficient effective balance for this cheque.', 400);
            }

            if (forcePay) {
                info(`Force Pay Override used by ${userName} for Cheque ${number}. Shortage ignored.`);
            }
        }

        const cheque = await this.cashBankRepository.createCheque({
            number, payee, amount, date: new Date(date), bankName, type, accountId, sector, notes,
            userId, tenantId: tenantId as any
        });

        info(`Cheque created by ${userName}: ${number} for ${amount}`);
        
        await this.invalidateFinanceCache(userId);
        
        return cheque;
    }

    async updateChequeStatus(id: string, status: string, userId: string, userName: string): Promise<any> {
        return this.cashBankRepository.executeInTransaction(async (session) => {
            const cheque = await this.cashBankRepository.findChequeById(id, userId, session);
            if (!cheque) throw new AppError('Cheque not found', 404);

            const oldStatus = cheque.status;
            const updatedCheque = await this.cashBankRepository.updateCheque(id, userId, { status: status as any }, session);
            if (!updatedCheque) throw new AppError('Update failed', 500);

            if (status === 'CLEARED' && oldStatus !== 'CLEARED') {
                await this.cashBankRepository.createTransaction({
                    type: cheque.type === 'RECEIVED' ? 'in' : 'out',
                    amount: cheque.amount,
                    fromAccount: cheque.type === 'RECEIVED' ? 'External' : cheque.accountId.toString(),
                    toAccount: cheque.type === 'RECEIVED' ? cheque.accountId.toString() : 'External',
                    description: `Cheque ${status}: ${cheque.number}`,
                    reference: cheque.number,
                    date: new Date(),
                    userId,
                }, session);
                await this.cashBankRepository.updateBalance(cheque.accountId.toString(), cheque.type === 'RECEIVED' ? cheque.amount : -cheque.amount, session);
            }

            info(`Cheque ${id} status updated to ${status} by ${userName}`);
            
            await this.invalidateFinanceCache(userId);

            return updatedCheque;
        });
    }

    async getEffectiveBalance(id: string, userId: string, dateString?: string): Promise<any> {
        const targetDate = dateString ? new Date(dateString) : new Date();

        const account = await this.cashBankRepository.findAccountById(id, userId);
        if (!account) throw new AppError('Account not found', 404);

        const pendingIssuedCheques = await this.cashBankRepository.getPendingIssuedCheques(id, userId, targetDate);

        const totalPDCForDate = pendingIssuedCheques.reduce((sum, c) => sum + c.amount, 0);
        const effectiveBalance = account.currentBalance - totalPDCForDate;

        const sameDayPDCs = pendingIssuedCheques.filter(c =>
            new Date(c.date).toDateString() === targetDate.toDateString()
        );

        return {
            currentBalance: account.currentBalance,
            effectiveBalance,
            pdcsIncluded: pendingIssuedCheques.length,
            totalPDCValue: totalPDCForDate,
            sameDayAlerts: {
                count: sameDayPDCs.length,
                total: sameDayPDCs.reduce((sum, c) => sum + c.amount, 0)
            }
        };
    }

    async getDayEndSummary(userId: string, dateString?: string): Promise<any> {
        const targetDate = dateString ? new Date(dateString) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const cashInTransactions = await this.cashBankRepository.getDailyCashTransactions(userId, startOfDay, endOfDay, 'in');
        const cashSales = cashInTransactions.reduce((sum, t) => sum + t.amount, 0);

        const cashOutTransactions = await this.cashBankRepository.getDailyCashTransactions(userId, startOfDay, endOfDay, 'out');
        const cashExpenses = cashOutTransactions.reduce((sum, t) => sum + t.amount, 0);

        const pendingCheques = await this.cashBankRepository.getDailyCheques(userId, startOfDay, endOfDay, 'PENDING');

        return {
            openingCash: 0,
            cashSales,
            cashExpenses,
            expectedCash: cashSales - cashExpenses,
            pendingCheques,
            supplierAlerts: []
        };
    }

    async saveDayEndToDB(_userId: string, userName: string): Promise<void> {
        info(`Day End Reconciliation saved by ${userName} for date ${new Date().toDateString()}`);
        
        await this.invalidateFinanceCache(_userId);
    }

    async getAllTransactions(userId: string): Promise<ICashbankTransaction[]> {
        return this.cashBankRepository.queryTransactions({ userId }, { date: -1 });
    }
}
