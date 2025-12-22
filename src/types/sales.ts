import { Product } from './product';
import { Sector, TaxMode, PaymentMethod } from './common';

export interface CartItem extends Product {
    qty: number;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    points: number;
    creditBias?: number; // Just in case, but sticking to knowns
    creditBalance?: number;
    creditLimit?: number;
    riskScore?: number;
    lastPaymentDate?: string;
}

export interface Sale {
    id: string;
    date: string;
    items: CartItem[];
    total: number;
    customerName?: string;
    customerId?: string;
    sector: Sector;
    branchId?: string;
    taxMode?: TaxMode;
    paymentMethod?: PaymentMethod;
}

export interface BillSession {
    id: number;
    label: string;
    cart: CartItem[];
    customerId: string | null;
    taxMode: TaxMode;
    paymentMethod: PaymentMethod;
}

export interface Session {
    id: string;
    label: string;
    cart: CartItem[];
    customerId: string | null;
    taxMode: TaxMode;
    paymentMethod: PaymentMethod;
}

// Redux State Interface
export interface POSState {
    sessions: Session[];
    activeSessionIndex: number;
    customers: Customer[];
    salesHistory: Sale[];
}
