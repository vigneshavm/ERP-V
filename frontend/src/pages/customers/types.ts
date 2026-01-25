export interface Customer {
    _id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    dues: number;
    points: number;
    tier?: string;
    referrer?: string | { _id: string; name: string };
    totalPurchases?: number;
    purchaseCount?: number;
    lastPurchase?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface CustomerGroup {
    _id: string;
    id?: string; // Some components might use 'id' instead of '_id'
    name: string;
    description: string;
    color: string;
    discountPercent: number;
    creditLimit: number;
    paymentTerms: number;
    memberCount: number;
    icon: string;
}

export interface LoyaltyTier {
    name: string;
    minPoints: number;
    discountPercent: number;
    pointsMultiplier: number;
    color: string;
}

export interface LoyaltyTransaction {
    id: string;
    customerId: string;
    customerName: string;
    date: string;
    type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'BONUS';
    points: number;
    invoiceRef?: string;
    description: string;
}

export interface LedgerEntry {
    id: string;
    date: string;
    type: 'SALE' | 'PAYMENT' | 'RETURN' | 'CREDIT_NOTE';
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}
