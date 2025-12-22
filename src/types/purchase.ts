import { Sector, Branch } from './common';

export interface ScanItem {
    name: string;
    qty: number;
    cost: number;
    sku?: string;
    productType?: string;
}

export interface PurchaseOrder {
    id: string;
    vendor: string;
    date: string;
    items: ScanItem[];
    total: number;
    status: 'PENDING' | 'APPROVED';
    sector: Sector;
    branchId: Branch;
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

// Redux State Interface
export interface PurchaseState {
    pendingInvoice: InvoiceData | null;
    isProcessing: boolean;
    orders: PurchaseOrder[];
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
