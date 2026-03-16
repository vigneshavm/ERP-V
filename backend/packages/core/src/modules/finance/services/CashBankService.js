var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { injectable, inject } from "tsyringe";
import { CashBankRepository } from '../repositories/CashBankRepository.js';
import { AppError } from '@smarterp/shared/utils/AppError.js';
import { info } from '@smarterp/shared/config/logger.js';
import { ObjectId } from "mongodb";
import { invalidateUserCache } from '@smarterp/shared/config/cache.js';
let CashBankService = class CashBankService {
    cashBankRepository;
    constructor(cashBankRepository) {
        this.cashBankRepository = cashBankRepository;
    }
    async invalidateFinanceCache(userId) {
        await invalidateUserCache(userId, '/api/finance*');
        await invalidateUserCache(userId, '/api/reports*');
    }
    // Account Logic
    async getAccounts(userId) {
        const accounts = await this.cashBankRepository.getAccounts(userId);
        return accounts.map(acc => ({
            ...acc,
            accountNumber: this.cashBankRepository.decryptAccountNumber(acc.accountNumber)
        }));
    }
    async createAccount(data, userId, userName) {
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
    async updateAccount(id, userId, data, userName) {
        const account = await this.cashBankRepository.findAccountById(id, userId);
        if (!account)
            throw new AppError("Account not found", 404);
        if (data.currentBalance)
            delete data.currentBalance; // Prevent balance hack
        const updated = await this.cashBankRepository.updateAccount(id, userId, data);
        if (!updated)
            throw new AppError("Update failed", 500);
        info(`Bank account updated by ${userName}: ${updated.bankName}`);
        await this.invalidateFinanceCache(userId);
        return {
            ...updated,
            accountNumber: this.cashBankRepository.decryptAccountNumber(updated.accountNumber)
        };
    }
    async deleteAccount(id, userId, userName) {
        const count = await this.cashBankRepository.countTransactions(id);
        if (count > 0) {
            throw new AppError(`Cannot delete bank account with existing transactions (${count}).`, 400);
        }
        const deleted = await this.cashBankRepository.deleteAccount(id, userId);
        if (!deleted)
            throw new AppError("Account not found", 404);
        info(`Bank account deleted by ${userName}: ${deleted.bankName}`);
        await this.invalidateFinanceCache(userId);
    }
    // Transaction Logic
    async getTransactions(id, userId) {
        return this.cashBankRepository.getTransactions(userId, id);
    }
    async createTransfer(data, userId, userName) {
        const { fromAccount, toAccount, amount, description } = data;
        if (!fromAccount || !toAccount || !amount)
            throw new AppError("Invalid transfer data", 400);
        if (fromAccount === toAccount)
            throw new AppError("Source and destination cannot be same", 400);
        return this.cashBankRepository.executeInTransaction(async (session) => {
            // Validation
            if (fromAccount !== 'cash') {
                const acc = await this.cashBankRepository.findAccountById(fromAccount, userId, session);
                if (!acc)
                    throw new AppError("Source account not found", 404);
                if (acc.currentBalance < amount)
                    throw new AppError("Insufficient balance in source account", 400);
            }
            else {
                const cashBal = await this.cashBankRepository.getCashBalance(userId, session);
                if (cashBal < amount)
                    throw new AppError(`Insufficient cash. Available: ${cashBal}`, 400);
            }
            const txn = await this.cashBankRepository.createTransaction({
                type: 'transfer', amount, fromAccount, toAccount, description, userId, date: new Date()
            }, session);
            // Update Balances
            if (fromAccount !== 'cash')
                await this.cashBankRepository.updateBalance(fromAccount, -amount, session);
            if (toAccount !== 'cash')
                await this.cashBankRepository.updateBalance(toAccount, amount, session);
            info(`Transfer by ${userName}: ${amount} from ${fromAccount} to ${toAccount}`);
            await this.invalidateFinanceCache(userId);
            return txn;
        });
    }
    async createCashTransaction(data, userId, userName) {
        const { type, amount, otherAccount, description, reference, date } = data;
        if (!type || !amount || !otherAccount)
            throw new AppError("Missing fields", 400);
        let fromAccount, toAccount;
        if (type === 'in') {
            fromAccount = otherAccount;
            toAccount = 'cash';
        }
        else {
            fromAccount = 'cash';
            toAccount = otherAccount;
        }
        const isBankTransfer = ObjectId.isValid(otherAccount);
        return this.cashBankRepository.executeInTransaction(async (session) => {
            if (isBankTransfer) {
                if (type === 'in') { // Bank -> Cash
                    const bank = await this.cashBankRepository.findAccountById(otherAccount, userId, session);
                    if (!bank)
                        throw new AppError("Bank not found", 404);
                    if (bank.currentBalance < amount)
                        throw new AppError("Insufficient bank balance", 400);
                }
                else { // Cash -> Bank
                    const cashBal = await this.cashBankRepository.getCashBalance(userId, session);
                    if (cashBal < amount)
                        throw new AppError("Insufficient cash", 400);
                }
            }
            const txn = await this.cashBankRepository.createTransaction({
                type: isBankTransfer ? 'transfer' : type,
                amount, fromAccount, toAccount, description, reference, date: date || new Date(), userId
            }, session);
            if (isBankTransfer) {
                if (type === 'in')
                    await this.cashBankRepository.updateBalance(otherAccount, -amount, session);
                else
                    await this.cashBankRepository.updateBalance(otherAccount, amount, session);
            }
            info(`Cash ${type} by ${userName}: ${amount}`);
            await this.invalidateFinanceCache(userId);
            return txn;
        });
    }
    // Ledger & Reports
    async getLedger(accountId, userId, queryParams) {
        const { startDate, endDate, reconciled } = queryParams;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const isReconciled = reconciled !== undefined ? reconciled === 'true' : undefined;
        // Account Details (or Cash)
        let account;
        if (accountId === 'cash') {
            const balance = await this.cashBankRepository.getCashBalance(userId);
            account = {
                _id: 'cash', bankName: 'Cash in Hand', accountNumber: 'CASH-ACCOUNT',
                openingBalance: 0, currentBalance: balance
            };
        }
        else {
            const acc = await this.cashBankRepository.findAccountById(accountId, userId);
            if (!acc)
                throw new AppError("Account not found", 404);
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
    async toggleReconciliation(id, userId) {
        const txn = await this.cashBankRepository.findTransactionById(id, userId);
        if (!txn)
            throw new AppError("Transaction not found", 404);
        const newState = !txn.reconciled;
        const updated = await this.cashBankRepository.updateTransaction(id, userId, {
            reconciled: newState,
            reconciledDate: newState ? new Date() : undefined,
            reconciledBy: newState ? userId : undefined
        });
        await this.invalidateFinanceCache(userId);
        return updated;
    }
    async bulkReconcile(ids, userId, reconciled) {
        const result = await this.cashBankRepository.updateManyTransactions(ids, userId, {
            reconciled,
            reconciledDate: reconciled ? new Date() : undefined,
            reconciledBy: reconciled ? userId : undefined
        });
        await this.invalidateFinanceCache(userId);
        return result;
    }
    async getPosition(userId) {
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
    async getBankSummary(userId) {
        const accounts = await this.cashBankRepository.getAccounts(userId);
        const totalBalance = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
        const accountCount = accounts.length;
        const decryptedAccounts = accounts.map(acc => ({
            ...acc,
            accountNumber: this.cashBankRepository.decryptAccountNumber(acc.accountNumber)
        }));
        return { accounts: decryptedAccounts, totalBalance, accountCount };
    }
    async validatePayments(accountId, payments, userId) {
        const account = await this.cashBankRepository.findAccountById(accountId, userId);
        if (!account)
            throw new AppError('Account not found', 404);
        const allPendingIssued = await this.cashBankRepository.getPendingIssuedCheques(accountId, userId);
        const totalPDCValue = allPendingIssued.reduce((sum, c) => sum + c.amount, 0);
        const effectiveBalance = account.currentBalance - totalPDCValue;
        const results = payments.map((p) => ({
            ...p,
            status: effectiveBalance >= p.amount ? 'approved' : 'insufficient_funds',
            shortage: effectiveBalance >= p.amount ? 0 : p.amount - effectiveBalance
        }));
        return {
            openingBalance: account.currentBalance,
            effectiveBalance,
            results,
            approved: results.every((r) => r.status === 'approved')
        };
    }
    async getCheques(userId, sector) {
        const query = { userId };
        if (sector)
            query.sector = sector;
        return this.cashBankRepository.queryCheques(query, { date: 1 });
    }
    async createCheque(data, userId, tenantId, userName) {
        const { number, payee, amount, date, bankName, type, accountId, sector, notes, forcePay } = data;
        if (type === 'ISSUED') {
            const account = await this.cashBankRepository.findAccountById(accountId, userId);
            if (!account)
                throw new AppError('Account not found', 404);
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
            userId, tenantId: tenantId
        });
        info(`Cheque created by ${userName}: ${number} for ${amount}`);
        await this.invalidateFinanceCache(userId);
        return cheque;
    }
    async updateChequeStatus(id, status, userId, userName) {
        return this.cashBankRepository.executeInTransaction(async (session) => {
            const cheque = await this.cashBankRepository.findChequeById(id, userId, session);
            if (!cheque)
                throw new AppError('Cheque not found', 404);
            const oldStatus = cheque.status;
            const updatedCheque = await this.cashBankRepository.updateCheque(id, userId, { status: status }, session);
            if (!updatedCheque)
                throw new AppError('Update failed', 500);
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
    async getEffectiveBalance(id, userId, dateString) {
        const targetDate = dateString ? new Date(dateString) : new Date();
        const account = await this.cashBankRepository.findAccountById(id, userId);
        if (!account)
            throw new AppError('Account not found', 404);
        const pendingIssuedCheques = await this.cashBankRepository.getPendingIssuedCheques(id, userId, targetDate);
        const totalPDCForDate = pendingIssuedCheques.reduce((sum, c) => sum + c.amount, 0);
        const effectiveBalance = account.currentBalance - totalPDCForDate;
        const sameDayPDCs = pendingIssuedCheques.filter(c => new Date(c.date).toDateString() === targetDate.toDateString());
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
    async getDayEndSummary(userId, dateString) {
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
    async saveDayEndToDB(_userId, userName) {
        info(`Day End Reconciliation saved by ${userName} for date ${new Date().toDateString()}`);
        await this.invalidateFinanceCache(_userId);
    }
    async getAllTransactions(userId) {
        return this.cashBankRepository.queryTransactions({ userId }, { date: -1 });
    }
};
CashBankService = __decorate([
    injectable(),
    __param(0, inject(CashBankRepository)),
    __metadata("design:paramtypes", [CashBankRepository])
], CashBankService);
export { CashBankService };
