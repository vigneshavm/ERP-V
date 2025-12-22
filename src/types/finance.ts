import { Sector, TransactionType } from './common';

export interface Expense {
    id: string;
    date: string;
    category: string;
    amount: number;
    description: string;
    sector: Sector;
}

export interface Transaction {
    id: string;
    type: TransactionType;
    amount: number;
    date: string;
    description: string;
    sector: Sector;
    category?: string;
    branchId?: string;
}

export interface Cheque {
    id: string;
    number: string;
    bankName: string;
    payee: string;
    amount: number;
    date: string;
    status: 'PENDING' | 'CLEARED' | 'BOUNCED';
    type: 'ISSUED' | 'RECEIVED';
    sector: Sector;
}

// Redux State Interface
export interface FinanceState {
    bankBalance: number;
    cheques: Cheque[];
    transactions: Transaction[];
}
