import { Sector, BranchId } from './common';

export interface ScanItem {
    name: string;
    qty: number;
    cost: number;
    sku?: string;
    productType?: string;
}

// Re-export specific status types if needed, or define them inline
export type PurchaseOrderStatus = 'Draft' | 'Pending' | 'Approved' | 'Converted' | 'Cancelled';

export interface PurchaseOrderItem {
    product_id?: string;
    product_name: string;
    sku?: string;
    quantity: number;
    rate: number;
    tax_percent: number;
    discount_amount: number;
    line_total: number;
}

export interface PurchaseOrder {
    id: string;
    po_number: string;
    vendor_name: string;
    vendor_id?: string;
    po_date: string;
    expected_delivery?: string;
    items: PurchaseOrderItem[];
    total_amount: number;
    status: PurchaseOrderStatus;
    notes?: string;
    created_at: string;

    // Legacy fields for backward compatibility if needed, or cleanup
    // vendor: string; // -> vendor_name
    // date: string; // -> po_date
    // total: number; // -> total_amount
    // sector: Sector; // Optional depending on usage
    branch_id?: string; // Optional depending on usage
}

export interface InvoiceItem {
    sku: string; // inferred or generated
    name: string;
    quantity: number;
    cost: number;
}

export interface InvoiceData {
    vendor: string;
    date: string;
    items: InvoiceItem[];
    totalCost: number;
}

export interface ScannedInvoiceItem {
    sku?: string;
    name: string;
    productType?: string;
    qty: number;
    cost?: number;
}

export interface ScannedInvoice {
    vendor?: string;
    date?: string;
    items: ScannedInvoiceItem[];
}

export interface PurchasePayment {
    _id: string;
    paymentNo: string;
    paymentDate: string;
    supplierId: string;
    paymentMethod: string;
    amount: number;
    notes?: string;
    createdAt?: string;
}

// Redux State Interface
export interface PurchaseState {
    pendingInvoice: InvoiceData | null;
    isProcessing: boolean;
    orders: PurchaseOrder[];
    payments: PurchasePayment[];
}

export interface FinalizedPurchaseItem {
    sku: string;
    name: string;
    productType: string;
    category: string;
    qty: number;
    cost: number;
    sellingPrice: number;
    barcode: string;
}
