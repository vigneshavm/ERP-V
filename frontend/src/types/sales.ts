import { Product } from './product';
import { Sector, TaxMode, PaymentMethod } from './common';

export interface EstimateItem {
    itemId?: string; // Product ID
    name: string;
    quantity: number;
    price: number;
    total: number;
    sku?: string; // Frontend helper
}

export interface Estimate {
    id: string;
    _id?: string;
    estimateNo: string;
    customer?: string | null; // ObjectId or null (Walk-in)
    items: EstimateItem[];
    subtotal: number;
    discount: number;
    totalAmount: number;
    notes?: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    validUntil?: string;
    createdAt: string;
    updatedAt?: string;

    // Frontend helpers
    tenantId?: string;
    customerName?: string; // Helper
    customerPhone?: string; // Helper
    customerEmail?: string; // Helper
    sector?: Sector;
}

export interface CartItem extends Product {
    qty: number;
    cutLength?: number;
    variantId?: string; // Track product variant if applicable
}

export interface Customer {
    id: string;
    _id?: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    dues: number; // Backend uses 'dues' instead of outstanding_balance
    points: number; // Backend uses 'points'
    tier?: string; // 'Silver', 'Gold', etc.
    referredBy?: string;
    owner?: string;
    tenantId: string;
    creditBias?: number; // Legacy/Frontend
    creditBalance?: number; // Backend? Not in model, maybe calculated
    creditLimit?: number; // Backend? Not in model
    riskScore?: number; // Legacy/Frontend
    lastPaymentDate?: string;
    totalVisits?: number;
    totalSpent?: number;
    walletBalance?: number;
}

export type SaleStatus = 'COMPLETED' | 'PREORDER' | 'FULFILLED' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL';

export interface InvoiceItem {
    item: string; // Product ID
    name?: string; // Frontend helper
    sku?: string; // Frontend helper
    quantity: number;
    price: number;
    tax: number;
    discount: number;
    total: number;
}

export interface Invoice {
    id: string; // _id
    _id?: string;
    invoiceNo: string;
    tenantId: string;
    customer?: string; // ObjectId

    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    discount: number;
    totalAmount: number;

    paidAmount: number;
    creditApplied: number;
    previousDueAmount: number;

    paymentStatus: 'paid' | 'unpaid' | 'partial';
    paymentMethod: string;

    createdAt: string;
    updatedAt?: string;

    // Frontend helpers
    customerName?: string;
    customerPhone?: string;
    status?: string; // Legacy/Frontend helper
    sector?: string;
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
