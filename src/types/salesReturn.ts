
export interface SalesReturnItem {
    id: string;
    salesReturnId: string;
    productId: string;
    productName?: string; // Helpful for UI, might need join
    variantId?: string; // If using variants
    quantity: number;
    unitPrice: number;
    taxAmount: number;
    lineTotal: number;
    condition: 'resellable' | 'damaged' | 'expired' | 'defective';
    reason?: string;
    restockFee?: number;
}

export interface SalesReturn {
    id: string;
    tenantId: string;
    branchId: string;
    invoiceId?: string;
    customerId?: string;
    customerName?: string; // UI helper
    returnDate: string;
    subtotal: number;
    taxAmount: number;
    totalRefundAmount: number;
    status: 'pending' | 'approved' | 'completed' | 'cancelled';
    refundMethod: 'cash' | 'card' | 'wallet' | 'exchange' | 'upi' | 'bank_transfer';
    refundStatus: 'pending' | 'processed';
    returnReason?: string;
    notes?: string;
    items?: SalesReturnItem[];
    createdBy?: string;
}

export interface CreditNote {
    id: string;
    tenantId: string;
    creditNoteNumber: string;
    customerId?: string;
    salesReturnId?: string;
    amount: number;
    balanceAmount: number;
    issueDate: string;
    expiryDate?: string;
    status: 'active' | 'redeemed' | 'expired' | 'void';
    notes?: string;
}
