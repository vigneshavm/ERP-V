import { SystemRole, AppView, Sector, TaxMode } from './common';
import { Employee } from './hr';

export interface SettingsState {
    appName: string;
    logoUrl?: string;
    primaryColor: string;
    enabledModules: Record<string, boolean>;
    rolePermissions: Record<SystemRole, AppView[]>;
    defaultTaxMode: TaxMode;
}

export interface AppSettings {
    appName: string;
    logoUrl?: string;
    primaryColor: string;
    enabledModules: {
        pos: boolean;
        inventory: boolean;
        finance: boolean;
        labor: boolean;
        purchases: boolean;
        storefront: boolean;
        sales: boolean;
        daily: boolean;
    };
    rolePermissions: Record<SystemRole, AppView[]>;
}

// Redux State Interface
export interface AuthState {
    user: Employee | null;
    currentSector: Sector;
    currentBranch: string;
    role: SystemRole;
    theme: 'light' | 'dark';
}
