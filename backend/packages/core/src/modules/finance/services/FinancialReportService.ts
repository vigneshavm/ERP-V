import { injectable, inject } from "tsyringe";
import { ChartOfAccountRepository } from '@smarterp/shared/repositories/ChartOfAccountRepository.js';
import { JournalEntryRepository } from '@smarterp/shared/repositories/JournalEntryRepository.js';

@injectable()
export class FinancialReportService {
    constructor(
        @inject(ChartOfAccountRepository) private accountRepo: ChartOfAccountRepository,
        @inject(JournalEntryRepository) protected journalRepo: JournalEntryRepository
    ) { }

    async getTrialBalance(tenantId: string): Promise<any> {
        const accounts = await this.accountRepo.findAll(tenantId);
        const report = accounts.map(acc => ({
            code: acc.code,
            name: acc.name,
            debit: acc.currentBalance > 0 ? acc.currentBalance : 0,
            credit: acc.currentBalance < 0 ? Math.abs(acc.currentBalance) : 0
        }));

        const totals = report.reduce((acc, curr) => {
            acc.totalDebit += curr.debit;
            acc.totalCredit += curr.credit;
            return acc;
        }, { totalDebit: 0, totalCredit: 0 });

        return { report, totals };
    }

    async getProfitAndLoss(tenantId: string, _startDate: string, _endDate: string): Promise<any> {
        const accounts = await this.accountRepo.findAll(tenantId);
        
        // Filter for Income and Expense accounts
        const incomeAccounts = accounts.filter(a => a.type === 'Income');
        const expenseAccounts = accounts.filter(a => a.type === 'Expense');

        // calculate net income = income - expenses
        // In a real system, we'd look at historical journal entries for the period.
        // For simplicity here, we'll use currentBalance (assuming it represents current YTD)
        // or we could filter journal entries if we want a specific period.
        
        const incomeTotal = incomeAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
        const expenseTotal = expenseAccounts.reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);

        return {
            income: incomeAccounts.map(a => ({ name: a.name, amount: a.currentBalance })),
            expenses: expenseAccounts.map(a => ({ name: a.name, amount: Math.abs(a.currentBalance) })),
            totalIncome: incomeTotal,
            totalExpense: expenseTotal,
            netProfit: incomeTotal - expenseTotal
        };
    }

    async getBalanceSheet(tenantId: string): Promise<any> {
        const accounts = await this.accountRepo.findAll(tenantId);
        
        const assets = accounts.filter(a => a.type === 'Asset');
        const liabilities = accounts.filter(a => a.type === 'Liability');
        const equity = accounts.filter(a => a.type === 'Equity');

        const totalAssets = assets.reduce((sum, a) => sum + a.currentBalance, 0);
        const totalLiabilities = liabilities.reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);
        const totalEquity = equity.reduce((sum, a) => sum + Math.abs(a.currentBalance), 0);

        return {
            assets: assets.map(a => ({ name: a.name, amount: a.currentBalance })),
            liabilities: liabilities.map(a => ({ name: a.name, amount: Math.abs(a.currentBalance) })),
            equity: equity.map(a => ({ name: a.name, amount: Math.abs(a.currentBalance) })),
            totalAssets,
            totalLiabilities,
            totalEquity,
            totalLiabilitiesAndEquity: totalLiabilities + totalEquity
        };
    }
}
