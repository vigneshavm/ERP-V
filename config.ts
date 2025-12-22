
import { AppView, SystemRole } from "./src/types";

export const APP_CONFIG = {
  IS_DEMO: true, // Toggle this to false for production/clean slate
  DEMO_DATA_VERSION: '1.0' // Bump this to force re-seed if logic changes
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
    'LABOR'
  ],
  Staff: [
    'POS',
    'SALES',
    'DAILY',
    'INVENTORY',
    'PURCHASE' // Staff can upload, but not approve (handled in component)
  ],
  Manager: [
    'DASHBOARD',
    'POS',
    'SALES',
    'DAILY',
    'INVENTORY',
    'PURCHASE',
    'FINANCE',
    'LABOR'
  ]
};

// Check if a role has access to a specific view
export const hasAccess = (role: string, view: AppView): boolean => {
  const userRole = role as SystemRole;
  return PERMISSIONS[userRole]?.includes(view) || false;
};
