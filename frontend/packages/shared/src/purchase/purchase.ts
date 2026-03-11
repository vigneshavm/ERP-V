import { Sector } from '../common/common';

export type PurchaseOrderStatus =
    | 'Draft'
    | 'Pending'
    | 'Pending Approval'
    | 'Approved'
    | 'Partial Receipt'
    | 'Fully Received'
    | 'Converted'
    | 'Billed'
    | 'Paid'
    | 'Cancelled'
    | 'Rejected'
    | 'RECEIVED'
    | 'COMPLETED';

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
    unit?: string;
    rate: number;
    tax_percent: number;
    tax_type?: 'GST' | 'IGST' | 'VAT' | 'None';
    discount_amount: number;
    discount_percent: number;
    line_total: number;
    received_quantity?: number;
    lot_number?: string;
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
    branch_id?: string;
    delivery_location?: string;
    delivery_address?: string;
    reference_number?: string;
    terms_and_conditions?: string;
    approval_status?: ApprovalStatus;
    version?: number;
    tax_breakdown?: TaxBreakdown;
    amount_in_words?: string;
    _id?: string;
    purchaseNumber?: string;
    totalAmount?: number;
    vendorId?: string | { _id: string; name?: string; businessName?: string };
    date?: string;
    createdBy?: string | { _id: string; name: string };
}

export type Purchase = PurchaseOrder;

export interface PurchasePaymentMethod {
    bank_transfer: 'bank_transfer',
    cash: 'cash',
    cheque: 'cheque',
    credit_card: 'credit_card',
    other: 'other'
}

export type PurchasePaymentMethodType = keyof PurchasePaymentMethod;
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
    method: PurchasePaymentMethodType;
    status: PurchasePaymentStatus;
    total_amount: number;
    currency: string;
    exchange_rate: number;
    reference_id?: string;
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
    vendorInvoiceNo?: string;
    subTotal?: number;
    discount?: number;
    freight?: number;
    roundOff?: number;
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
export interface PurchaseInvoiceItem {
    sku: string;
    name: string;
    quantity: number;
    cost: number;
}

export interface InvoiceData {
    vendor: string;
    date: string;
    items: PurchaseInvoiceItem[];
    totalCost: number;
    _id?: string;
}

export interface PurchaseState {
    pendingInvoice: InvoiceData | null;
    isProcessing: boolean;
    orders: PurchaseOrder[];
    payments: PurchasePayment[];
    grns: GRN[];
    bills: PurchaseBill[];
    selectedOrder?: PurchaseOrder | null;
}
