import { Sector, BranchId } from './common';

export interface ScanItem {
    name: string;
    qty: number;
    cost: number;
    sku?: string;
    productType?: string;
}

// Re-export specific status types if needed, or define them inline
// Re-export specific status types if needed, or define them inline
export type PurchaseOrderStatus =
    | 'Draft'
    | 'Pending' // Legacy: equivalent to Pending Approval
    | 'Pending Approval'
    | 'Approved'
    | 'Partial Receipt'
    | 'Fully Received'
    | 'Converted' // Legacy: equivalent to Fully Received or Billed
    | 'Billed'
    | 'Paid'
    | 'Cancelled'
    | 'Rejected';

export type GRNStatus = 'Draft' | 'Submitted' | 'Accepted' | 'Rejected' | 'Partial';
export type InspectionStatus = 'Accepted' | 'Rejected' | 'Hold' | 'Partial';

export type ApprovalStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';

export interface TaxBreakdown {
    cgst: number;
    sgst: number;
    igst: number;
    vat: number;
}

export interface PurchaseOrderItem {
    product_id?: string;
    product_name: string;
    sku?: string;
    quantity: number;
    rate: number;
    tax_percent: number;
    discount_amount: number;
    line_total: number;
    received_quantity?: number;
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
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
    receipt_status?: 'Received' | 'Pending';
    attachments?: string[];
    payment_terms?: string;
    reference_doc?: string;

    // Legacy fields for backward compatibility if needed, or cleanup
    // vendor: string; // -> vendor_name
    // date: string; // -> po_date
    // total: number; // -> total_amount
    // sector: Sector; // Optional depending on usage
    branch_id?: string; // Optional depending on usage
    delivery_location?: string;
    delivery_address?: string;
    reference_number?: string;
    terms_and_conditions?: string;
    approval_status?: ApprovalStatus;
    version?: number;
    tax_breakdown?: TaxBreakdown;
    amount_in_words?: string;

    // Backend compatibility fields
    _id?: string;
    purchaseNumber?: string;
    totalAmount?: number;
    vendorId?: string | { _id: string; name?: string; businessName?: string };
    date?: string;
    createdBy?: string | { _id: string; name: string };
}
export type Purchase = PurchaseOrder;

export interface PurchaseInvoiceItem {
    sku: string; // inferred or generated
    name: string;
    quantity: number;
    cost: number;
}

export interface InvoiceData {
    vendor: string;
    date: string;
    items: PurchaseInvoiceItem[];
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

export type PurchasePaymentMethod = 'bank_transfer' | 'cash' | 'cheque' | 'credit_card' | 'other';
export type PurchasePaymentStatus = 'Pending' | 'Cleared' | 'Failed' | 'Reversed';

export interface PaymentBillAllocation {
    bill_id: string;
    bill_number: string;
    amount_paid: number;
    discount_applied?: number;
}

export interface PurchasePayment {
    id: string;
    payment_number: string;
    payment_date: string;
    vendor_id: string;
    vendor_name: string;
    method: PurchasePaymentMethod;
    status: PurchasePaymentStatus;
    total_amount: number;
    currency: string;
    exchange_rate: number;
    reference_id?: string; // Cheque No, Transfer ID
    bank_account_id?: string;
    allocations: PaymentBillAllocation[];
    notes?: string;
    reversal_reason?: string;
    attachments: string[];
    created_at: string;
    created_by?: string;
    updated_at?: string;
    branch_id?: string;
}

// Redux State Interface
export interface PurchaseState {
    pendingInvoice: InvoiceData | null;
    isProcessing: boolean;
    orders: PurchaseOrder[];
    payments: PurchasePayment[];
    grns: GRN[];
    bills: PurchaseBill[];
    selectedOrder?: PurchaseOrder | null;
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

export interface GRNItem {
    id: string;
    poItemId: string;
    productId: string;
    productName: string;
    sku?: string;
    orderedQty: number;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty: number;
    inspectionStatus: InspectionStatus;
    discrepancyNotes?: string;
    batchNumber?: string;
    serialNumber?: string;
    expiryDate?: string;
}

export interface GRN {
    id: string;
    grnNumber: string;
    poId: string;
    poNumber: string;
    vendorId: string;
    vendorName: string;
    receivedDate: string;
    status: GRNStatus;
    notes?: string;
    items: GRNItem[];
    attachments?: string[];
    billReference?: string;
    branch_id?: string;
    created_at: string;
    created_by?: string;
}

// === Bill Management (2.8) ===

export type BillStatus =
    | 'Received'
    | 'Matched'
    | 'Approved'
    | 'Paid'
    | 'Partially Paid'
    | 'Disputed'
    | 'Hold'
    | 'Rejected';

export interface PurchaseBillItem {
    id: string;
    product_id: string;
    product_name: string;
    sku?: string;
    grn_quantity: number;
    bill_quantity: number;
    grn_rate: number;
    bill_rate: number;
    tax_percent: number;
    discount_amount: number;
    line_total: number;
    variance_flag?: boolean;
    variance_reason?: string;
}

export interface PurchaseBill {
    id: string;
    bill_number: string;
    bill_date: string;
    vendor_id: string;
    vendor_name: string;
    po_id?: string;
    po_number?: string;
    grn_id?: string;
    grn_number?: string;
    items: PurchaseBillItem[];
    amount: number;
    tax_breakdown: TaxBreakdown & { other: number };
    total_amount: number;
    due_date: string;
    payment_terms: string;
    status: BillStatus;
    attachments: string[];
    notes?: string;
    dispute_reason?: string;
    hold_reason?: string;
    created_at: string;
    created_by?: string;
    updated_at?: string;
    branch_id?: string;
}

// === Purchase Returns Management (2.10) ===

export type PurchaseReturnStatus =
    | 'Initiated'
    | 'In-Transit'
    | 'Received by Vendor'
    | 'Processed'
    | 'Credited'
    | 'Cancelled';

export type ReturnReason =
    | 'Defective'
    | 'Wrong Item'
    | 'Excess Quantity'
    | 'Quality Issues'
    | 'Others';

export interface PurchaseReturnItem {
    id: string;
    product_id: string;
    product_name: string;
    sku?: string;
    grn_quantity: number;
    return_quantity: number;
    rate: number;
    tax_percent: number;
    line_total: number;
}

export interface PurchaseReturn {
    id: string;
    return_number: string;
    return_date: string;
    vendor_id: string;
    vendor_name: string;
    grn_id: string;
    grn_number: string;
    po_id?: string;
    po_number?: string;
    reason: ReturnReason;
    other_reason?: string;
    status: PurchaseReturnStatus;
    items: PurchaseReturnItem[];
    total_amount: number;
    tax_amount: number;
    tracking_number?: string;
    shipping_carrier?: string;
    expected_credit_date?: string;
    debit_note_id?: string;
    attachments: string[];
    notes?: string;
    created_at: string;
    created_by?: string;
    updated_at?: string;
    branch_id?: string;
}
