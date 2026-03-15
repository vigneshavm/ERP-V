import { TenantUser } from './core';
import { Sector, SystemRole, TaxMode, AppView, BranchId } from '@repo/shared';

export interface UserVisualIdentity {
    theme?: 'light' | 'dark' | 'system';
    primaryColor?: string;
    loginLogoUrl?: string;
    visualIdentityConfig?: Record<string, any>;
}

export interface SettingsState {
    appName: string;
    logoUrl: string;
    primaryColor: string;
    enabledModules: {
        pos: boolean;
        inventory: boolean;
        finance: boolean;
        labor: boolean;
        purchases: boolean;
        sales: boolean;
        daily: boolean;
        storefront: boolean;
        [key: string]: boolean | undefined;
    };
    rolePermissions: Record<string, AppView[]>;
    defaultTaxMode: TaxMode;
    expiryRules: {
        criticalDays: number;
        criticalDiscount: number;
        highDays: number;
        highDiscount: number;
        mediumDays: number;
        mediumDiscount: number;
    };
    sales?: {
        defaultDiscount?: number;
    };
}
