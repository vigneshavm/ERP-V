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
    PersonalTransactionType
} from './types';

export interface IDataAdapter {
    // User Methods
    getUser(): Promise<PersonalUser>;
    updateUserSettings(settings: Partial<PersonalUser>): Promise<PersonalUser>;
    getContacts(): Promise<any[]>;

    // Transaction Methods
    getTransactions(limit?: number): Promise<PersonalTransaction[]>;
    getTransactionById(id: string): Promise<PersonalTransaction | null>;
    createTransaction(transaction: Omit<PersonalTransaction, 'id' | 'createdAt'>): Promise<PersonalTransaction>;
    updateTransaction(id: string, updates: Partial<PersonalTransaction>): Promise<PersonalTransaction>;
    deleteTransaction(id: string): Promise<boolean>;

    // Category Methods
    getCategories(): Promise<PersonalCategory[]>;
    createCategory(category: Omit<PersonalCategory, 'id'>): Promise<PersonalCategory>;

    // Bank Account Methods
    getBankAccounts(): Promise<PersonalBankAccount[]>;

    // Goal Methods
    getGoals(): Promise<PersonalGoal[]>;
    createGoal(goal: Omit<PersonalGoal, 'id' | 'status'>): Promise<PersonalGoal>;
    updateGoalProgress(id: string, currentAmount: number): Promise<PersonalGoal>;

    // Loan Methods
    getLoans(): Promise<PersonalLoan[]>;
    getLoanDetails(id: string): Promise<PersonalLoan | null>;
    createLoan(loan: Omit<PersonalLoan, 'id' | 'status'>): Promise<PersonalLoan>;
    recordLoanPayment(id: string, amount: number): Promise<PersonalLoan>;
    deleteLoan(id: string): Promise<boolean>;

    // Budget Methods
    getBudget(): Promise<PersonalBudget>;
    updateBudgetMode(mode: 'zero-based' | 'flexible'): Promise<PersonalBudget>;
    updateCategoryBudget(categoryId: string, allotted: number): Promise<PersonalBudget>;

    // SMS Methods
    getSmsRules(): Promise<SmsRule[]>;
    getPendingSmsTransactions(): Promise<SmsTransaction[]>;
    convertSmsToTransaction(smsId: string, categoryId: string): Promise<PersonalTransaction>;

    // Analytics Methods
    getAnalyticsSummary(period: 'month' | 'year'): Promise<AnalyticsSummary>;
    getYearlyOverview(year: number): Promise<YearlyOverview>;
}
