
import { AppView, UserRole } from "./types";

export const APP_CONFIG = {
  IS_DEMO: true, // Toggle this to false for production/clean slate
  DEMO_DATA_VERSION: '1.0' // Bump this to force re-seed if logic changes
};

// Role-Based Access Control Configuration
export const PERMISSIONS: Record<UserRole, AppView[]> = {
  Owner: [
    'dashboard', 
    'pos', 
    'sales', 
    'daily', 
    'inventory', 
    'purchases', 
    'finance', 
    'labor'
  ],
  Staff: [
    'pos', 
    'sales', 
    'daily', 
    'inventory', 
    'purchases' // Staff can upload, but not approve (handled in component)
  ]
};

// Check if a role has access to a specific view
export const hasAccess = (role: string, view: AppView): boolean => {
  const userRole = role as UserRole;
  return PERMISSIONS[userRole]?.includes(view) || false;
};
