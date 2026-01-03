
export interface Vendor {
    id: string;
    tenantId: string;
    name: string;
    phone?: string;
    gstin?: string;
    address?: string;
    contactPerson?: string;
    openingBalance: number; // Positive = Credit (Payable), Negative = Debit
    currentBalance: number;
    isActive: boolean;
    createdAt?: string;
}

export type VendorTransactionType = 'PURCHASE' | 'PAYMENT' | 'RETURN' | 'ADJUSTMENT';

export interface VendorTransaction {
    id: string;
    tenantId: string;
    vendorId: string;
    type: VendorTransactionType;
    amount: number;
    balanceAfter: number;
    date: string;
    description?: string;
    referenceId?: string;
}

export interface VendorState {
    vendors: Vendor[];
    transactions: VendorTransaction[];
    isLoading: boolean;
    error: string | null;
}
