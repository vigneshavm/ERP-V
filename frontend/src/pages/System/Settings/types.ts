export interface GeneralSettings {
    appName: string;
    businessType: string;
    addressLine1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
    website: string;
}

export interface GeneralTabProps {
    appName: string;
    setAppName: (value: string) => void;
    businessType: string;
    setBusinessType: (value: string) => void;
    addressLine1: string;
    setAddressLine1: (value: string) => void;
    city: string;
    setCity: (value: string) => void;
    state: string;
    setState: (value: string) => void;
    pincode: string;
    setPincode: (value: string) => void;
    phone: string;
    setPhone: (value: string) => void;
    email: string;
    setEmail: (value: string) => void;
    website: string;
    setWebsite: (value: string) => void;
}

export type TenantTheme = 'light' | 'dark' | 'system';

export interface BrandingTabProps {
    tenantTheme: TenantTheme;
    setTenantTheme: (theme: TenantTheme) => void;
    primaryColor: string;
    setPrimaryColor: (color: string) => void;
    logoUrl: string | null;
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface FinanceTabProps {
    taxMode: string;
    setTaxMode: (mode: string) => void;
    gstin?: string;
    setGstin?: (value: string) => void;
    pan?: string;
    setPan?: (value: string) => void;
    bankName?: string;
    setBankName?: (value: string) => void;
    accNo?: string;
    setAccNo?: (value: string) => void;
    ifsc?: string;
    setIfsc?: (value: string) => void;
    accountHolderName?: string;
    setAccountHolderName?: (value: string) => void;
}

export interface ModulesConfig {
    pos: boolean;
    inventory: boolean;
    finance: boolean;
    labor: boolean;
    purchases: boolean;
    sales: boolean;
    daily: boolean;
    storefront: boolean;
    customers?: boolean;
    suppliers?: boolean;
    reports?: boolean;
    [key: string]: boolean | undefined;
}

export interface ModulesTabProps {
    modules: ModulesConfig;
    handleModuleToggle: (id: string) => void;
}

export interface MISConfig {
    allowNegativeStock: boolean;
    allowSaleBelowCost: boolean;
    enableCreditSales: boolean;
    enableVendorPayables: boolean;
    enableCustomerReceivables: boolean;
    allowPriceOverride: boolean;
    allowDiscountOverride: boolean;
    maxDiscountPercent: number;
    enableAuditTrail: boolean;
    allowBackdatedBills?: boolean;
    allowCancelledBillsEdit?: boolean;
    requireApprovalForHighDiscount?: boolean;
    [key: string]: boolean | number | undefined;
}

export interface MISControlsTabProps {
    misConfig: MISConfig;
    handleMisToggle: (key: string) => void;
    setMaxDiscountPercent: (value: number) => void;
}

import { AppView } from '../../../types/common';

export interface SecurityTabProps {
    roles: any[]; // Using any for now, ideally strictly typed with Role
    permissions: Record<string, AppView[]>;
    handlePermissionToggle: (roleCode: string, view: AppView) => void;
}

export interface PersonalizationTabProps {
    userTheme: TenantTheme;
    setUserTheme: (theme: TenantTheme) => void;
    userColor: string;
    setUserColor: (color: string) => void;
    userLogo: string | null;
    handleUserLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
