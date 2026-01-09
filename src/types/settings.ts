import { TenantUser } from './tenant';
import { Sector } from './common';

export interface UserVisualIdentity {
    theme?: 'light' | 'dark' | 'system';
    primaryColor?: string;
    loginLogoUrl?: string;
    visualIdentityConfig?: Record<string, any>;
}

export interface AuthState {
    user: TenantUser | null;
    currentSector: Sector;
    currentBranch: string;
    role: SystemRole;
    theme: 'light' | 'dark' | 'system';
    userPreferences?: UserVisualIdentity;
    isLoading: boolean;
    isSuccess: boolean;
    isError: string | null;
}

import { AppView, SystemRole } from './common';

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
        [key: string]: boolean;
    };
    rolePermissions: Record<string, AppView[]>;
    defaultTaxMode: string;
    expiryRules: {
        criticalDays: number;
        criticalDiscount: number;
        highDays: number;
        highDiscount: number;
        mediumDays: number;
        mediumDiscount: number;
    };
}
