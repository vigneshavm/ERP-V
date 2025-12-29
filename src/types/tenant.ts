import { Sector, ModuleType } from './common';
import { SettingsState } from './settings';

export interface RegionConfig {
    currency: string;
    currencySymbol: string;
    dateFormat: string;
}

export interface TenantConfig {
    modules: string[];
    theme: 'light' | 'dark';
    primaryColor: string;
    layout: 'standard' | 'compact';
}

export interface BranchConfig {
    id: string;
    name: string;
    city: string;
    address: string;
    config?: Partial<TenantConfig>;
    settings?: Partial<SettingsState>;
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
    updatedAt?: string;
}

// Redux State Interface
export interface TenantState {
    tenants: Tenant[];
    branches: any[];
}
