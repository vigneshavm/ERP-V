
export type SupplierType = 'Manufacturer' | 'Wholesaler' | 'Distributor';
export type BalanceType = 'Payable' | 'Receivable';
export type VendorStatus = 'Active' | 'Inactive';

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
    isActive: boolean; // Legacy field, will keep for compatibility
    supplierType?: SupplierType;
    balanceType?: BalanceType;
    creditPeriod: number;
    status: VendorStatus;
    email?: string;
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
    selectedVendor: Vendor | null;
    isLoading: boolean;
    error: string | null;
}
