import { Sector, ModuleType } from './common';
import { SettingsState } from './settings';

export interface RegionConfig {
    currency: string;
    currencySymbol: string;
    dateFormat: string;
}

export interface LoyaltyConfig {
    earningRate: number; // e.g., 100
    pointsPerRate: number; // e.g., 1
    redemptionValue: number; // e.g., 1
    minPointsToRedeem?: number;
    maxRedemptionPerBill?: number;
    categoryPercentages?: Record<string, number>; // e.g., { 'Saree': 1.0 }
}

export interface TenantConfig {
    modules: string[];
    theme: 'light' | 'dark';
    primaryColor: string;
    layout: 'standard' | 'compact';
}

export interface Counter {
    id: string; // e.g., 'C1'
    name: string; // e.g., 'Main Counter'
    cashierId?: string; // Assigned Cashier (Employee ID)
    lastBillNumber: number; // For sequential series
}

export interface BranchConfig {
    id: string;
    name: string;
    city: string;
    address: string;
    config?: Partial<TenantConfig>;
    settings?: Partial<SettingsState>;
    counters?: Counter[];
    updatedAt?: string;
}

export interface TenantLocation {
    city: string;
    branches: BranchConfig[];
}

export interface Tenant {
    id: string;
    name: string;
    sector: Sector;
    subdomain?: string;
    modules?: ModuleType[];
    isActive?: boolean;
    region?: RegionConfig;
    theme?: 'light' | 'dark';
    layout?: 'standard' | 'compact';
    domain?: string;
    primaryColor?: string;
    defaultConfig?: TenantConfig;
    locations?: TenantLocation[];
    loginLogoUrl?: string;
    loginBgUrl?: string;
    loyaltyConfig?: LoyaltyConfig;
    updatedAt?: string;
}

// Redux State Interface
export interface TenantState {
    tenants: Tenant[];
    branches: any[];
}
