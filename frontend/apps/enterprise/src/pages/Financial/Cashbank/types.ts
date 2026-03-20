import { LucideIcon } from 'lucide-react';

export interface Account {
    _id: string;
    bankName: string;
    accountNumber: string;
    accountType: string;
    branch: string;
    ifsc: string;
    openingBalance: number;
    currentBalance: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Transaction {
    _id: string;
    date: string;
    description: string;
    amount: number;
    type: 'in' | 'out' | 'transfer';
    reference?: string;
    account?: string;
    fromAccount?: string;
    toAccount?: string;
    reconciled?: boolean;
    runningBalance?: number;
    debit?: number;
    credit?: number;
}

export interface CashBankPosition {
    cashInHand: number;
    totalBankBalance: number;
    totalLiquidity: number;
    breakdown: {
        cash: {
            amount: number;
            percentage: number;
        };
        bank: {
            amount: number;
            percentage: number;
            accounts: number;
        };
    };
}

export interface BankSummary {
    totalBalance: number;
    accountCount: number;
    accounts: Account[];
}

export interface LedgerData {
    account: Account;
    summary: {
        openingBalance: number;
        totalCredits: number;
        totalDebits: number;
        closingBalance: number;
    };
    ledger: Transaction[];
}

export interface Loan {
    id: number;
    lenderName: string;
    loanType: 'borrowed' | 'lent';
    loanAmount: number;
    balanceRemaining: number;
    interestRate: number;
    emiAmount: number;
    tenure: number;
    paidEMIs: number;
    status: 'active' | 'closed';
    startDate: string;
    nextEMIDate?: string | null;
}

export interface Cheque {
    id: number;
    chequeNo: string;
    partyName: string;
    amount: number;
    date: string;
    bankName: string;
    type: 'received' | 'issued';
    status: 'pending' | 'cleared' | 'bounced';
    clearDate?: string | null;
    notes?: string;
}

export interface TypeConfig {
    [key: string]: {
        icon: LucideIcon;
        color: string;
        bg: string;
        text: string;
        border?: string;
    };
}
