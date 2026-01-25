import { Product } from './product';
import { Sector, TaxMode, PaymentMethod } from './common';

export interface CartItem extends Product {
    qty: number;
    cutLength?: number;
    variantId?: string; // Track product variant if applicable
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    points: number;
    tier?: 'Silver' | 'Gold' | 'Platinum' | 'General';
    creditBias?: number; // Just in case, but sticking to knowns
    creditBalance?: number;
    creditLimit?: number;
    riskScore?: number;
    lastPaymentDate?: string;
    tenantId?: string;
    totalVisits?: number;
    totalSpent?: number;
    walletBalance?: number;
    email?: string;
    address?: string;
}

export type SaleStatus = 'COMPLETED' | 'PREORDER' | 'FULFILLED' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL';

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
    status: SaleStatus;
    paymentStatus: PaymentStatus;
    userId?: string; // For role-based filtering (Staff view their own)
    counterId?: string;
    counterName?: string;
    loyaltyPointsEarned?: number;
    redeemedPoints?: number;
    redemptionAmount?: number;
}

export interface BillSession {
    id: number;
    label: string;
    cart: CartItem[];
    customerId: string | null;
    taxMode: TaxMode;
    paymentMethod: PaymentMethod;
    redeemedPoints?: number;
}

export interface Session {
    id: string;
    label: string;
    cart: CartItem[];
    customerId: string | null;
    counterId?: string;
    taxMode: TaxMode;
    paymentMethod: PaymentMethod;
    redeemedPoints?: number;
}

// Redux State Interface
export interface POSState {
    sessions: Session[];
    activeSessionIndex: number;
    customers: Customer[];
    salesHistory: Sale[];
    activeCounterId?: string;
    heldBills?: any[]; // Temporary loose type to avoid circular dependency, or better yet, define HeldBill here or keep it generic
}
