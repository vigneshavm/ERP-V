
import { AppView, SystemRole } from "./types";

export const APP_CONFIG = {
    IS_DEMO: true,
    API_BASE_URL: 'http://localhost:3000',
    DEMO_DATA_VERSION: '1.0'
};

// Role-Based Access Control Configuration
export const PERMISSIONS: Record<SystemRole, AppView[]> = {
    Owner: [
        'DASHBOARD',
        'POS',
        'SALES',
        'DAILY',
        'INVENTORY',
        'PURCHASE',
        'FINANCE',
        'LABOR',
        'STOREFRONT',
        'SETTINGS'
    ],
    Manager: [
        'DASHBOARD',
        'POS',
        'SALES',
        'DAILY',
        'INVENTORY',
        'PURCHASE',
        'LABOR'
    ],
    Staff: [
        'POS',
        'SALES',
        'DAILY',
        'INVENTORY',
        'PURCHASE' // Staff can upload, but not approve (handled in component)
    ]
};

// Check if a role has access to a specific view
export const hasAccess = (role: string, view: AppView): boolean => {
    const userRole = role as SystemRole;
    return PERMISSIONS[userRole]?.includes(view) || false;
};
