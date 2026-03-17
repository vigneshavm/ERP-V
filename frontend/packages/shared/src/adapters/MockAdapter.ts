import { IDataAdapter } from './IDataAdapter';
import { 
    PersonalUser, 
    PersonalTransaction, 
    PersonalCategory, 
    PersonalBankAccount, 
    PersonalGoal, 
    PersonalLoan, 
    PersonalBudget, 
    SmsRule, 
    SmsTransaction,
    AnalyticsSummary,
    YearlyOverview,
    PersonalTransactionType as TransactionType,
    PaymentMethod,
    AccountType,
    LoanStatus,
    GoalStatus,
    JournalEntry,
    StockReport,
    DashboardStats,
    SupplierAnalytics
} from './types';

const delay = (ms: number = 450) => new Promise(resolve => setTimeout(resolve, ms));

class MockAdapterImpl implements IDataAdapter {
    private user: PersonalUser = {
        id: 'u1',
        name: 'Vignesh K',
        email: 'vignesh.chennai@example.com',
        currency: 'INR',
        totalWealth: 1254500,
        monthStartDay: 1,
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
    };

    private categories: PersonalCategory[] = [
        { id: 'c1', name: 'Groceries', icon: 'ShoppingBag', color: '#4CAF50', type: 'expense', monthlyBudget: 12000 },
        { id: 'c2', name: 'Rent & Maintenance', icon: 'Home', color: '#2196F3', type: 'expense', monthlyBudget: 25000 },
        { id: 'c3', name: 'Dining Out', icon: 'Utensils', color: '#FF9800', type: 'expense', monthlyBudget: 8000 },
        { id: 'c4', name: 'Salary', icon: 'Briefcase', color: '#9C27B0', type: 'income' },
        { id: 'c5', name: 'Freelance', icon: 'Cpu', color: '#00BCD4', type: 'income' },
        { id: 'c6', name: 'Transport', icon: 'Navigation', color: '#F44336', type: 'expense', monthlyBudget: 5000 },
        { id: 'c7', name: 'Health & Medical', icon: 'Heart', color: '#E91E63', type: 'expense', monthlyBudget: 3000 },
        { id: 'c8', name: 'Subscriptions', icon: 'Smartphone', color: '#3F51B5', type: 'expense', monthlyBudget: 2000 },
        { id: 'c9', name: 'Investment Returns', icon: 'TrendingUp', color: '#009688', type: 'income' },
    ];

    private accounts: PersonalBankAccount[] = [
        { id: 'acc1', bankName: 'SBI', accountNumber: '4321', accountType: AccountType.SAVINGS, currentBalance: 450000, isActive: true },
        { id: 'acc2', bankName: 'HDFC Bank', accountNumber: '9876', accountType: AccountType.CURRENT, currentBalance: 780000, isActive: true },
        { id: 'acc3', bankName: 'ICICI Credit Card', accountNumber: '1122', accountType: AccountType.CC, currentBalance: -24500, isActive: true },
    ];

    private transactions: PersonalTransaction[] = [];
    private goals: PersonalGoal[] = [];
    private loans: PersonalLoan[] = [];
    private budget: PersonalBudget;
    private smsRules: SmsRule[] = [
        { id: 'r1', sender: 'AD-SBIINB', pattern: 'debited by (\\d+)', suggestedCategory: 'Groceries' },
        { id: 'r2', sender: 'HDFCBK', pattern: 'Spent (\\d+) on CARD', suggestedCategory: 'Dining Out' },
    ];
    private pendingSms: SmsTransaction[] = [
        { id: 'sms1', sender: 'AXISBK', amount: 450, date: new Date().toISOString(), rawText: 'Spent Rs. 450 at Sangeetha Veg Restaurant', type: 'debit', merchant: 'Sangeetha Veg', status: 'pending' },
    ];

    // ERP Mocks
    private journalEntries: JournalEntry[] = [];
    private dashboardStats: DashboardStats;
    private stockReport: StockReport;
    private suppliers: SupplierAnalytics[] = [];

    constructor() {
        this.seedData();
        
        // Initial Budget
        this.budget = {
            id: 'b1',
            mode: 'flexible',
            totalBudget: 55000,
            spentAmount: 32400,
            categoryBudgets: this.categories.filter(c => c.type === 'expense').map(c => ({
                categoryId: c.id,
                categoryName: c.name,
                allotted: c.monthlyBudget || 0,
                spent: Math.floor(Math.random() * (c.monthlyBudget || 5000))
            }))
        };

        // ERP Seed
        this.dashboardStats = {
            totalRevenue: 2450000,
            totalOutstanding: 450000,
            totalBalance: 1250000,
            totalProfit: 850000,
            dailySales: [
                { _id: '2026-03-10', totalSales: 120000 },
                { _id: '2026-03-11', totalSales: 150000 },
                { _id: '2026-03-12', totalSales: 95000 },
                { _id: '2026-03-13', totalSales: 110000 },
                { _id: '2026-03-14', totalSales: 210000 },
                { _id: '2026-03-15', totalSales: 180000 },
                { _id: '2026-03-16', totalSales: 240000 },
            ],
            revenueVsExpenses: [
                { month: '2025-10', revenue: 1800000, expenses: 1400000 },
                { month: '2025-11', revenue: 2100000, expenses: 1600000 },
                { month: '2025-12', revenue: 2400000, expenses: 1800000 },
                { month: '2026-01', revenue: 2000000, expenses: 1550000 },
                { month: '2026-02', revenue: 2300000, expenses: 1750000 },
                { month: '2026-03', revenue: 2500000, expenses: 1900000 },
            ]
        };

        this.stockReport = {
            summary: { totalItems: 1250, lowStockItems: 15, totalValue: 8540000 },
            items: [
                { id: 'p1', name: 'Industrial Motor A1', sku: 'MOT-A1', stockQty: 45, minStockLevel: 10, costPrice: 15000 },
                { id: 'p2', name: 'Precision Gears', sku: 'GEAR-P2', stockQty: 8, minStockLevel: 20, costPrice: 2500 },
                { id: 'p3', name: 'Heavy Duty Bearings', sku: 'BEAR-H3', stockQty: 120, minStockLevel: 50, costPrice: 850 },
            ]
        };

        this.suppliers = [
            { id: 's1', name: 'Zenith Engineering', netBalance: 125000, totalInvoices: 12, lastPaymentDate: '2026-02-15' },
            { id: 's2', name: 'Global Logistics Corp', netBalance: 45000, totalInvoices: 8, lastPaymentDate: '2026-03-01' },
            { id: 's3', name: 'Precision Parts Ltd', netBalance: 0, totalInvoices: 25, lastPaymentDate: '2026-03-10' },
        ];

        this.journalEntries = [
            {
                id: 'j1',
                date: new Date().toISOString(),
                reference: 'JV/2026/001',
                description: 'Opening balance for Petty Cash',
                status: 'POSTED',
                entries: [{ accountId: '101', accountName: 'Petty Cash', debit: 1000, credit: 0 }]
            },
            {
                id: 'j2',
                date: new Date().toISOString(),
                reference: 'JV/2026/002',
                description: 'Salary distribution for March 2026',
                status: 'POSTED',
                entries: [
                    { accountId: '501', accountName: 'Salary Expense', debit: 500000, credit: 0 },
                    { accountId: '102', accountName: 'HDFC Bank Account', debit: 0, credit: 500000 }
                ]
            }
        ];
    }

    private seedData() {
        // Seed 25 transactions
        const merchants = [
            'Saravana Bhavan', 'Nalli Silks', 'PVR Cinemas', 'Big Bazaar', 'Swiggy', 'Zomato', 
            'Amazon India', 'A2B Restaurants', 'MedPlus', 'Apollo Pharmacy', 'ACT Fibernet', 
            'TNEB Electricity', 'Chennai Metro', 'Uber', 'Ola Cabs'
        ];

        for (let i = 0; i < 25; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const type = Math.random() > 0.8 ? TransactionType.INCOME : TransactionType.EXPENSE;
            const categoryIdx = type === TransactionType.INCOME ? 4 : Math.floor(Math.random() * 3);
            const category = this.categories[categoryIdx];
            
            this.transactions.push({
                id: `t${i}`,
                type,
                amount: type === TransactionType.INCOME ? 120000 : Math.floor(Math.random() * 5000) + 100,
                category: category.name,
                categoryId: category.id,
                accountId: 'acc1',
                accountName: 'SBI',
                date: date.toISOString(),
                description: type === TransactionType.INCOME ? 'Professional Services' : merchants[Math.floor(Math.random() * merchants.length)],
                paymentMethod: i % 3 === 0 ? PaymentMethod.UPI : (i % 3 === 1 ? PaymentMethod.CARD : PaymentMethod.CASH),
                isRecurring: i % 10 === 0,
                createdAt: date.toISOString()
            });
        }

        // Seed Goals
        this.goals = [
            { id: 'g1', name: 'New iPhone 16 Pro', targetAmount: 130000, currentAmount: 45000, deadline: '2026-06-30', status: GoalStatus.IN_PROGRESS, color: '#000000', category: 'Gadgets' },
            { id: 'g2', name: 'Trip to Ooty', targetAmount: 40000, currentAmount: 40000, deadline: '2026-04-15', status: GoalStatus.COMPLETED, color: '#4CAF50', category: 'Travel' },
            { id: 'g3', name: 'Emergency Fund', targetAmount: 500000, currentAmount: 250000, deadline: '2027-12-31', status: GoalStatus.IN_PROGRESS, color: '#FF9800', category: 'Savings' },
        ];

        // Seed Loans
        this.loans = [
            { 
                id: 'l1', 
                name: 'HDFC Car Loan', 
                bank: 'HDFC Bank',
                type: 'Borrowed',
                principalAmount: 1200000, 
                interestRate: 8.5, 
                termMonths: 60, 
                emiAmount: 24650, 
                totalPendingAmount: 852400, 
                paidAmount: 347600, 
                startDate: '2023-01-10', 
                deadline: '10 Jan 2028',
                status: LoanStatus.ACTIVE,
                color: '#3498DB',
                icon: 'Landmark'
            },
            { 
                id: 'l2', 
                name: 'ICICI Education Loan', 
                bank: 'ICICI Bank',
                type: 'Borrowed',
                principalAmount: 800000, 
                interestRate: 11.2, 
                termMonths: 36, 
                emiAmount: 26200, 
                totalPendingAmount: 420000, 
                paidAmount: 380000, 
                startDate: '2024-05-20', 
                deadline: '20 May 2027',
                status: LoanStatus.ACTIVE,
                color: '#E67E22',
                icon: 'Landmark'
            },
        ];
    }

    async getUser(): Promise<PersonalUser> {
        await delay();
        return { ...this.user };
    }

    async updateUserSettings(settings: Partial<PersonalUser>): Promise<PersonalUser> {
        await delay();
        this.user = { ...this.user, ...settings };
        return { ...this.user };
    }

    async getContacts(): Promise<any[]> {
        await delay();
        return [];
    }

    async getTransactions(limit?: number): Promise<PersonalTransaction[]> {
        await delay();
        const sorted = [...this.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return limit ? sorted.slice(0, limit) : sorted;
    }

    async getTransactionById(id: string): Promise<PersonalTransaction | null> {
        await delay();
        return this.transactions.find(t => t.id === id) || null;
    }

    async createTransaction(transaction: Omit<PersonalTransaction, 'id' | 'createdAt'>): Promise<PersonalTransaction> {
        await delay();
        const newTxn: PersonalTransaction = {
            ...transaction,
            id: `t${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        this.transactions.unshift(newTxn);
        return newTxn;
    }

    async updateTransaction(id: string, updates: Partial<PersonalTransaction>): Promise<PersonalTransaction> {
        await delay();
        const idx = this.transactions.findIndex(t => t.id === id);
        if (idx === -1) throw new Error('Transaction not found');
        this.transactions[idx] = { ...this.transactions[idx], ...updates };
        return this.transactions[idx];
    }

    async deleteTransaction(id: string): Promise<boolean> {
        await delay();
        const idx = this.transactions.findIndex(t => t.id === id);
        if (idx === -1) return false;
        this.transactions.splice(idx, 1);
        return true;
    }

    async getCategories(): Promise<PersonalCategory[]> {
        await delay();
        return [...this.categories];
    }

    async createCategory(category: Omit<PersonalCategory, 'id'>): Promise<PersonalCategory> {
        await delay();
        const newCat: PersonalCategory = { ...category, id: `c${Date.now()}` };
        this.categories.push(newCat);
        return newCat;
    }

    async getBankAccounts(): Promise<PersonalBankAccount[]> {
        await delay();
        return [...this.accounts];
    }

    async getGoals(): Promise<PersonalGoal[]> {
        await delay();
        return [...this.goals];
    }

    async createGoal(goal: Omit<PersonalGoal, 'id' | 'status'>): Promise<PersonalGoal> {
        await delay();
        const newGoal: PersonalGoal = { ...goal, id: `g${Date.now()}`, status: GoalStatus.IN_PROGRESS };
        this.goals.push(newGoal);
        return newGoal;
    }

    async updateGoalProgress(id: string, currentAmount: number): Promise<PersonalGoal> {
        await delay();
        const goal = this.goals.find(g => g.id === id);
        if (!goal) throw new Error('Goal not found');
        goal.currentAmount = currentAmount;
        if (goal.currentAmount >= goal.targetAmount) goal.status = GoalStatus.COMPLETED;
        return { ...goal };
    }

    async getLoans(): Promise<PersonalLoan[]> {
        await delay();
        return [...this.loans];
    }

    async getLoanDetails(id: string): Promise<PersonalLoan | null> {
        await delay();
        return this.loans.find(l => l.id === id) || null;
    }

    async createLoan(loan: Omit<PersonalLoan, 'id' | 'status'>): Promise<PersonalLoan> {
        await delay();
        const newLoan: PersonalLoan = {
            ...loan,
            id: `loan-${Date.now()}`,
            status: LoanStatus.ACTIVE
        };
        this.loans.push(newLoan);
        return { ...newLoan };
    }

    async recordLoanPayment(id: string, amount: number): Promise<PersonalLoan> {
        await delay();
        const loan = this.loans.find(l => l.id === id);
        if (!loan) throw new Error('Loan not found');
        loan.paidAmount += amount;
        loan.totalPendingAmount -= amount;
        if (loan.totalPendingAmount <= 0) {
            loan.totalPendingAmount = 0;
            loan.status = LoanStatus.CLOSED;
        }
        return { ...loan };
    }

    async deleteLoan(id: string): Promise<boolean> {
        await delay();
        const initialLength = this.loans.length;
        this.loans = this.loans.filter(l => l.id !== id);
        return this.loans.length < initialLength;
    }

    async getBudget(): Promise<PersonalBudget> {
        await delay();
        return { ...this.budget };
    }

    async updateBudgetMode(mode: 'zero-based' | 'flexible'): Promise<PersonalBudget> {
        await delay();
        this.budget.mode = mode;
        return { ...this.budget };
    }

    async updateCategoryBudget(categoryId: string, allotted: number): Promise<PersonalBudget> {
        await delay();
        const catBudget = this.budget.categoryBudgets.find(cb => cb.categoryId === categoryId);
        if (catBudget) {
            catBudget.allotted = allotted;
        } else {
            const cat = this.categories.find(c => c.id === categoryId);
            if (cat) {
                this.budget.categoryBudgets.push({
                    categoryId,
                    categoryName: cat.name,
                    allotted,
                    spent: 0
                });
            }
        }
        return { ...this.budget };
    }

    async getSmsRules(): Promise<SmsRule[]> {
        await delay();
        return [...this.smsRules];
    }

    async getPendingSmsTransactions(): Promise<SmsTransaction[]> {
        await delay();
        return [...this.pendingSms];
    }

    async convertSmsToTransaction(smsId: string, categoryId: string): Promise<PersonalTransaction> {
        await delay();
        const smsIdx = this.pendingSms.findIndex(s => s.id === smsId);
        if (smsIdx === -1) throw new Error('SMS not found');
        const sms = this.pendingSms[smsIdx];
        const category = this.categories.find(c => c.id === categoryId);
        
        const txn = await this.createTransaction({
            type: sms.type === 'credit' ? TransactionType.INCOME : TransactionType.EXPENSE,
            amount: sms.amount,
            category: category?.name || 'Uncategorized',
            categoryId: categoryId,
            accountId: 'acc1',
            accountName: 'SBI',
            date: new Date().toISOString(),
            description: `Converted from SMS: ${sms.merchant || 'Unknown'}`,
            paymentMethod: PaymentMethod.UPI,
            isRecurring: false
        });

        this.pendingSms.splice(smsIdx, 1);
        return txn;
    }

    async getAnalyticsSummary(period: 'month' | 'year'): Promise<AnalyticsSummary> {
        await delay();
        return {
            totalIncome: 154000,
            totalExpense: 92400,
            savingsRate: 40,
            topCategories: [
                { category: 'Rent', amount: 25000, percentage: 27 },
                { category: 'Groceries', amount: 15400, percentage: 17 },
                { category: 'Dining Out', amount: 8200, percentage: 9 },
            ],
            monthlyTrend: [
                { month: 'Jan', income: 140000, expense: 85000 },
                { month: 'Feb', income: 140000, expense: 91000 },
                { month: 'Mar', income: 154000, expense: 92400 },
            ]
        };
    }

    async getYearlyOverview(year: number): Promise<YearlyOverview> {
        await delay();
        return {
            year,
            totalIncome: 1800000,
            totalExpense: 1100000,
            netSavings: 700000,
            months: [
                { month: 'January', income: 150000, expense: 90000, savings: 60000 },
                { month: 'February', income: 150000, expense: 95000, savings: 55000 },
            ]
        };
    }

    // ERP & Enterprise Methods
    async getJournalEntries(): Promise<JournalEntry[]> {
        await delay();
        return [...this.journalEntries];
    }

    async getStockReport(): Promise<StockReport> {
        await delay();
        return { ...this.stockReport };
    }

    async getDashboardStats(): Promise<DashboardStats> {
        await delay();
        return { ...this.dashboardStats };
    }

    async getSuppliers(): Promise<SupplierAnalytics[]> {
        await delay();
        return [...this.suppliers];
    }
}

export const MockAdapter = new MockAdapterImpl();
