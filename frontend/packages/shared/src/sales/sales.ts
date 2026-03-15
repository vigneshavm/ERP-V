import { Product } from '../inventory';
import { Sector } from '../common/common';
import { TaxMode, PaymentMethod } from '../inventory/enums';

export interface EstimateItem {
    item?: string | any; // Product ID or populated Product
    itemId?: string; // Legacy/Frontend inconsistency
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
    customer?: Customer | string | null; // ObjectId or populated Customer or null
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
    price: number;
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
    referrer?: string | Customer;
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
    createdAt?: string;
    updatedAt?: string;
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
    customer?: string | Customer; // ObjectId or populated Customer

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
    paidViaMethod?: string; // found in InvoiceDetail
    splitPaymentDetails?: Array<{ method: string; amount: number }>; // found in InvoiceDetail

    createdBy?: {
        shopName?: string;
        gstNumber?: string;
        shopAddress?: string;
    };

    createdAt: string;
    updatedAt?: string;

    // Frontend helpers
    customerName?: string;
    customerPhone?: string;
    status?: string; // Legacy/Frontend helper
    sector?: string;
}

export interface PopulatedInvoice extends Omit<Invoice, 'customer'> {
    customer: Customer;
}

export interface Sale {
    id: string;
    _id?: string; // Compatibility with Invoice
    date: string;
    createdAt?: string; // Compatibility with Invoice
    items: any[]; // Relaxed for compatibility
    total: number;
    totalAmount?: number; // Compatibility with Invoice
    customerName?: string;
    customerId?: string;
    customer?: string | Customer; // Compatibility with Invoice
    sector: Sector | string;
    branchId?: string;
    taxMode?: TaxMode;
    paymentMethod?: PaymentMethod | string;
    status: SaleStatus | string;
    paymentStatus: PaymentStatus | string;
    userId?: string;
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

export interface SalesOrderItem {
    item: string | any; // Product ID or populated Product object
    name?: string;
    quantity: number;
    rate: number;
    tax: number;
    discount: number;
    amount?: number; // Calculated
    availableStock?: number; // Frontend helper
    deliveredQty?: number;
    reservedQty?: number;
    total?: number;
}

export interface SalesOrder {
    _id: string;
    orderNumber: string;
    customer: Customer | any; // Using any for nested usage (address object vs string)
    items: SalesOrderItem[];
    orderDate: string;
    expectedDeliveryDate: string;
    status: 'Draft' | 'Confirmed' | 'Partially Delivered' | 'Delivered' | 'Partially Invoiced' | 'Invoiced' | 'Cancelled';
    totalAmount: number;
    subtotal?: number;
    taxTotal?: number;
    discountTotal?: number;
    discount: number;
    notes?: string;
    createdBy?: { name: string; _id: string };
    deliveryChallans?: any[];
    invoices?: any[];
    isOverdue?: boolean; // Frontend/Backend helper
    createdAt: string;
    updatedAt: string;
}
