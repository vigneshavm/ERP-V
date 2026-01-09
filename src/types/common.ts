export const Sector = {
    GENERAL: 'General',
    PHARMACY: 'Pharmacy',
    ELECTRONICS: 'Electronics',
    GROCERY: 'Grocery',
    SUPERMARKET: 'Supermarket',
    TEXTILE: 'Textile',
    MOBILE_SHOP: 'Mobile Shop',
    SERVICES: 'Services',
    FMCG: 'FMCG'
} as const;

export type Sector = typeof Sector[keyof typeof Sector];

export type AttendanceStatus = 'PRESENT' | 'HALF' | 'QUARTER' | 'ABSENT';

export enum TransactionType {
    SALE = 'Sale',
    EXPENSE = 'EXPENSE',
    PURCHASE = 'Purchase',
    SALARY = 'Salary',
    INCOME = 'INCOME'
}

export type ModuleType = 'POS' | 'INVENTORY' | 'HR' | 'FINANCE' | 'ANALYTICS' | 'PURCHASE' | 'SALES' | 'DAILY' | 'STOREFRONT' | 'SERIAL_TRACKING' | 'INSTALLATION_SERVICE' | 'WEIGHT_SCALE_INTEGRATION';
export type BranchId = string;
export { TaxMode } from './product/enums';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI';
export type AppView = 'DASHBOARD' | 'PROFIT_PULSE' | 'POS' | 'INVENTORY' | 'PURCHASE' | 'FINANCE' | 'SALES' | 'DAILY' | 'LABOR' | 'STOREFRONT' | 'SETTINGS' | 'AGED_STOCK' | 'REPORTS' | 'VENDORS' | 'VENDOR_FORM' | 'VENDOR_DETAILS' | 'GROW' | 'SYNC_SHARE' | 'RESTORE' | 'BARCODE' | 'BULK_IMPORT' | 'DATA_EXPORT';
export type SystemRole = 'Owner' | 'Manager' | 'Staff';
