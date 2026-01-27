
export type SupplierType = 'manufacturer' | 'wholesaler' | 'distributor';
export type BalanceType = 'payable' | 'receivable';
export type VendorStatus = 'active' | 'inactive';

export interface Vendor {
    id: string; // _id
    _id?: string;
    tenantId: string;
    businessName: string;
    contactPersonName: string;
    contactNo: string;
    email: string;
    physicalAddress: string;
    gstNo: string;
    supplierType: SupplierType;
    openingBalance: number;
    balanceType: BalanceType;
    creditPeriod: number;
    status: VendorStatus;
    isActive?: boolean; // Legacy/Frontend helper
    createdAt?: string;
    updatedAt?: string;
    currentBalance?: number; // Frontend derived
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
