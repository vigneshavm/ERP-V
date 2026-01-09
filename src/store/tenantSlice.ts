
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Tenant, Branch, TenantState, TenantUser, DbRoleCode, TenantEcommerceConfig, GoogleBusinessConfig } from '../types/tenant';
import { SettingsState, AuthState, UserVisualIdentity } from '../types/settings';
import { ModuleType, Sector, SystemRole, AppView } from '../types/common';
import { getStoredTheme } from '../utils/theme'
import { supabase } from '../lib/supabase';
import { AppDispatch } from './index';



// --- Tenant Slice ---
const initialTenantState: TenantState = {
  tenants: [],
  branches: [
    { id: 'All', name: 'All Branches', city: 'Various', address: '', counters: [{ id: 'C1', name: 'Main Counter', lastBillNumber: 0 }, { id: 'C2', name: 'Express Counter', lastBillNumber: 0 }] }
  ],
  roles: []
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState: initialTenantState,
  reducers: {
    addTenant: (state, action: PayloadAction<Tenant>) => {
      const now = new Date().toISOString();
      const rawTenant = action.payload;
      if (!rawTenant) return;
      const normalizedLocations = (rawTenant.locations || []).map(loc => {
        if (!loc.branches || loc.branches.length === 0) {
          return {
            ...loc,
            branches: [{
              id: `br - fallback - ${loc.city.toLowerCase()} -${rawTenant.id} `,
              name: loc.city,
              city: loc.city,
              address: 'Main Office',
              updatedAt: now
            }]
          };
        }
        return loc;
      });
      const tenantToAdd = { ...rawTenant, locations: normalizedLocations, updatedAt: rawTenant.updatedAt || now } as Tenant;
      state.tenants.push(tenantToAdd);

      // Ensure branches from this tenant are recorded in global branch table
      if (action.payload.locations) {
        for (const loc of action.payload.locations) {
          const branches = loc.branches || [];
          if (branches.length === 0) {
            // Fallback: If no branches, use location city as default branch
            const fallbackId = `br - fallback - ${loc.city.toLowerCase()} -${action.payload.id} `;
            const exists = state.branches.find(sb => sb.id === fallbackId);
            if (!exists) {
              state.branches.push({
                id: fallbackId,
                name: loc.city,
                city: loc.city,
                address: 'Main Office',
                updatedAt: now
              });
            }
          } else {
            for (const b of branches) {
              const exists = state.branches.find(sb => sb.id === b.id || sb.name === b.name);
              if (!exists) {
                state.branches.push({ id: b.id || b.name, name: b.name || b.id, city: b.city || loc.city || '', address: b.address || '', updatedAt: b.updatedAt });
              }
            }
          }
        }
      }
    },
    toggleTenantStatus: (state, action: PayloadAction<string>) => {
      const tenant = state.tenants.find(t => t.id === action.payload);
      if (tenant) tenant.isActive = !tenant.isActive;
    },
    updateTenantModules: (state, action: PayloadAction<{ id: string, modules: ModuleType[] }>) => {
      const tenant = state.tenants.find(t => t.id === action.payload.id);
      if (tenant) tenant.modules = action.payload.modules;
    },
    updateTenantDetails: (state, action: PayloadAction<Tenant>) => {
      const index = state.tenants.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        const now = new Date().toISOString();
        const rawTenant = action.payload;
        if (!rawTenant) return;
        const normalizedLocations = (rawTenant.locations || []).map(loc => {
          if (!loc.branches || loc.branches.length === 0) {
            return {
              ...loc,
              branches: [{
                id: `br - fallback - ${loc.city.toLowerCase()} -${rawTenant.id} `,
                name: loc.city,
                city: loc.city,
                address: 'Main Office',
                updatedAt: now
              }]
            };
          }
          return loc;
        });
        state.tenants[index] = { ...rawTenant, locations: normalizedLocations, updatedAt: rawTenant.updatedAt || now } as Tenant;

        // Ensure branches from updated tenant exist in global branch table
        if (action.payload.locations) {
          for (const loc of action.payload.locations) {
            const branches = loc.branches || [];
            if (branches.length === 0) {
              // Fallback: If no branches, use location city as default branch
              const fallbackId = `br - fallback - ${loc.city.toLowerCase()} -${action.payload.id} `;
              const exists = state.branches.find(sb => sb.id === fallbackId);
              if (!exists) {
                state.branches.push({
                  id: fallbackId,
                  name: loc.city,
                  city: loc.city,
                  address: 'Main Office',
                  updatedAt: now
                });
              }
            } else {
              for (const b of branches) {
                const exists = state.branches.find(sb => sb.id === b.id || sb.name === b.name);
                if (!exists) {
                  state.branches.push({ id: b.id || b.name, name: b.name || b.id, city: b.city || loc.city || '', address: b.address || '', updatedAt: b.updatedAt });
                }
              }
            }
          }
        }
      }
    },
    setTenants: (state, action: PayloadAction<Tenant[]>) => {
      // Normalize tenants to ensure updatedAt exists and locations have branches
      const now = new Date().toISOString();
      state.tenants = (action.payload || []).map(t => {
        const normalizedLocations = (t.locations || []).map(loc => {
          if (!loc.branches || loc.branches.length === 0) {
            return {
              ...loc,
              branches: [{
                id: `br - fallback - ${loc.city.toLowerCase()} -${t.id} `,
                name: loc.city,
                city: loc.city,
                address: 'Main Office',
                updatedAt: t.updatedAt || now
              }]
            };
          }
          return loc;
        });
        return { ...t, locations: normalizedLocations, updatedAt: t.updatedAt || now } as Tenant;
      });

      // Ensure all branches referenced in tenants are present in global branch table
      const collected: any[] = [];
      for (const t of state.tenants) {
        if (!t.locations) continue;
        for (const loc of t.locations) {
          const branches = loc.branches || [];
          if (branches.length === 0) {
            // Fallback: If no branches, use location city as default branch
            const fallbackId = `br - fallback - ${loc.city.toLowerCase()} -${t.id} `;
            const exists = state.branches.find(sb => sb.id === fallbackId) || collected.find(cb => cb.id === fallbackId);
            if (!exists) {
              collected.push({
                id: fallbackId,
                name: loc.city,
                city: loc.city,
                address: 'Main Office',
                updatedAt: t.updatedAt || now
              });
            }
          } else {
            for (const b of branches) {
              const exists = state.branches.find(sb => sb.id === b.id || sb.name === b.name) || collected.find(cb => cb.id === b.id || cb.name === b.name);
              if (!exists) {
                collected.push({ id: b.id || b.name, name: b.name || b.id, city: b.city || loc.city || '', address: b.address || '', updatedAt: b.updatedAt });
              }
            }
          }
        }
      }
      if (collected.length > 0) {
        state.branches = [...(state.branches || []), ...collected];
      }
    },
    updateBranchSettings: (state, action: PayloadAction<{ tenantId: string, branchId: string, settings: Partial<SettingsState> }>) => {
      const tenant = state.tenants.find(t => t.id === action.payload.tenantId);
      if (tenant && tenant.locations) {
        for (const location of tenant.locations) {
          const branch = location.branches.find(b => b.id === action.payload.branchId);
          if (branch) {
            branch.settings = { ...(branch.settings || {}), ...action.payload.settings };
            break;
          }
        }
      }
    },
    // Ensure the global branch table contains a record for the given branchId.
    // If missing, attempt to find the branch inside tenant.locations and add it.
    ensureBranchRecorded: (state, action: PayloadAction<{ branchId: string }>) => {
      const bid = action.payload.branchId;
      if (!bid) return;
      const exists = state.branches.find(b => b.id === bid || b.name === bid);
      if (exists) return;

      // Search tenants' locations for a matching branch id/name
      for (const tenant of state.tenants) {
        if (!tenant.locations) continue;
        for (const loc of tenant.locations) {
          const found = (loc.branches || []).find(b => b.id === bid || b.name === bid);
          if (found) {
            const normalized = {
              id: found.id || bid,
              name: found.name || bid,
              city: found.city || loc.city || '',
              address: found.address || ''
            };
            state.branches.push(normalized);
            return;
          }
        }
      }

      // If not found in tenant data, add a minimal record using the id as name.
      state.branches.push({ id: bid, name: bid, city: '', address: '' });
    },
    setBranches: (state, action: PayloadAction<any[]>) => {
      state.branches = action.payload;
    },
    incrementCounterBillNumber: (state, action: PayloadAction<{ branchId: string, counterId: string }>) => {
      const branch = state.branches.find(b => b.id === action.payload.branchId);
      if (branch) {
        if (!branch.counters) branch.counters = [];
        const counter = branch.counters.find((c: any) => c.id === action.payload.counterId);
        if (counter) {
          counter.lastBillNumber = (counter.lastBillNumber || 0) + 1;
        } else {
          // Initialize if it doesn't exist (though it should have been defined)
          branch.counters.push({
            id: action.payload.counterId,
            name: `Counter ${action.payload.counterId} `,
            lastBillNumber: 1
          });
        }
      }
    },
    setRoles: (state, action: PayloadAction<any[]>) => {
      state.roles = action.payload;
    },
    updateTenantEcommerce: (state, action: PayloadAction<{ tenantId: string, config: TenantEcommerceConfig }>) => {
      const tenant = state.tenants.find(t => t.id === action.payload.tenantId);
      if (tenant) {
        tenant.ecommerceConfig = action.payload.config;
      }
    },
    updateGoogleBusinessProfile: (state, action: PayloadAction<{ tenantId: string, config: GoogleBusinessConfig }>) => {
      const tenant = state.tenants.find(t => t.id === action.payload.tenantId);
      if (tenant) {
        tenant.googleBusinessConfig = action.payload.config;
      }
    }
  }
});

export const {
  addTenant,
  toggleTenantStatus,
  updateTenantModules,
  updateTenantDetails,
  setTenants,
  updateBranchSettings,
  setBranches,
  ensureBranchRecorded,
  incrementCounterBillNumber,
  setRoles,
  updateTenantEcommerce,
  updateGoogleBusinessProfile
} = tenantSlice.actions;
export default tenantSlice.reducer;

// --- Auth Slice ---
const initialAuthState: AuthState = {
  user: null,
  currentSector: Sector.GENERAL,
  currentBranch: 'All',
  role: 'Staff',
  theme: getStoredTheme() || 'light',
  isLoading: false,
  isSuccess: false,
  isError: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setSector: (state, action: PayloadAction<Sector>) => {
      state.currentSector = action.payload;
    },
    setBranch: (state, action: PayloadAction<string>) => {
      state.currentBranch = action.payload;
    },
    setUser: (state, action: PayloadAction<TenantUser | null>) => {
      // Handle null (logout)
      if (!action.payload) {
        state.user = null;
        state.role = 'Staff';
        state.userPreferences = undefined;
        return;
      }
      state.user = action.payload;
      state.role = action.payload.systemRole;
      state.currentSector = action.payload.sector;
      state.currentBranch = 'All';
    },
    setUserPreferences: (state, action: PayloadAction<UserVisualIdentity | undefined>) => {
      state.userPreferences = action.payload;
      if (action.payload?.theme) {
        state.theme = action.payload.theme as 'light' | 'dark' | 'system';
      }
    },
    logout: (state) => {
      state.user = null;
      state.role = 'Staff';
      state.currentBranch = 'All';
      state.userPreferences = undefined;
      state.isSuccess = false;
      state.isError = null;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthSuccess: (state, action: PayloadAction<boolean>) => {
      state.isSuccess = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.isError = action.payload;
    }
  }
});

export const { setTheme, setSector, setBranch, setUser, setUserPreferences, logout, setAuthLoading, setAuthSuccess, setAuthError } = authSlice.actions;
export const authReducer = authSlice.reducer;

// --- Settings Slice ---
const initialSettingsState: SettingsState = {
  appName: 'Enterprise Manager',
  primaryColor: '#4f46e5',
  enabledModules: { pos: true, inventory: true, finance: true, labor: true, purchases: true, sales: true, daily: true, storefront: true },
  rolePermissions: {
    [DbRoleCode.OWNER]: ['DASHBOARD', 'PROFIT_PULSE', 'POS', 'INVENTORY', 'PURCHASE', 'VENDORS', 'VENDOR_FORM', 'AGED_STOCK', 'FINANCE', 'SALES', 'DAILY', 'LABOR', 'STOREFRONT', 'SETTINGS', 'REPORTS', 'GROW'],
    [DbRoleCode.ADMIN]: ['DASHBOARD', 'PROFIT_PULSE', 'POS', 'INVENTORY', 'PURCHASE', 'VENDORS', 'VENDOR_FORM', 'AGED_STOCK', 'FINANCE', 'SALES', 'DAILY', 'LABOR', 'STOREFRONT', 'SETTINGS', 'REPORTS', 'GROW'],
    [DbRoleCode.MANAGER]: ['DASHBOARD', 'PROFIT_PULSE', 'POS', 'INVENTORY', 'PURCHASE', 'VENDORS', 'VENDOR_FORM', 'AGED_STOCK', 'FINANCE', 'SALES', 'DAILY', 'LABOR', 'STOREFRONT', 'REPORTS'],
    [DbRoleCode.STAFF]: ['POS', 'DAILY', 'SALES', 'STOREFRONT']
  },
  defaultTaxMode: 'EXCLUSIVE',
  expiryRules: {
    criticalDays: 30,
    criticalDiscount: 50,
    highDays: 60,
    highDiscount: 30,
    mediumDays: 90,
    mediumDiscount: 15
  }
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: initialSettingsState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return { ...state, ...action.payload };
    },
    updateRolePermissions: (state, action: PayloadAction<{ role: SystemRole, views: AppView[] }>) => {
      state.rolePermissions[action.payload.role] = action.payload.views;
    },
    resetSettings: () => initialSettingsState
  }
});

export const { updateSettings, updateRolePermissions, resetSettings } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;

// --- Thunks ---
export const updateUserPassword = (newPassword: string) => async (dispatch: AppDispatch) => {
  dispatch(setAuthLoading(true));
  dispatch(setAuthError(null));
  dispatch(setAuthSuccess(false));

  try {
    // 1. Update Supabase Auth password
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      console.error('Supabase Password Update Error:', error);
      throw error;
    }

    console.log('Password updated in Auth successfully:', data);

    // 2. Synchronize with tenant_users table for custom Login RPC
    if (data.user) {
      const { data: syncData, error: syncError } = await supabase.rpc('sync_tenant_user_password', {
        p_user_id: data.user.id,
        p_email: data.user.email,
        p_new_password: newPassword
      });

      if (syncError) {
        console.error('Terminal Password Sync Error:', syncError);
        throw new Error(`Auth updated, but terminal synchronization failed: ${syncError.message}`);
      }

      if (syncData && !syncData.success) {
        console.warn('Terminal Sync Warning:', syncData.message);
        // We don't necessarily want to throw here if Auth was successful, 
        // but we should log it clearly.
      }
      console.log('Terminal password synchronized:', syncData);
    }

    dispatch(setAuthSuccess(true));
  } catch (err: any) {
    console.error('Catching Auth Error:', err);
    // Be more explicit about common Supabase errors
    let message = err.message || 'Failed to update password';
    if (err.status === 422) {
      message = `Update Rejected: ${err.message}. (Common causes: New password same as old, or link already used)`;
    }
    dispatch(setAuthError(message));
  } finally {
    dispatch(setAuthLoading(false));
  }
};

// --- E-commerce Thunks ---
export const activateEcommerce = (tenantId: string) => async (dispatch: AppDispatch) => {
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('init_tenant_ecommerce', { p_tenant_id: tenantId });
    if (rpcError) throw rpcError;

    // Fetch the updated config to sync store
    const { data: config, error: configError } = await supabase
      .from('tenant_ecommerce')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (configError) throw configError;

    // Convert snake_case from DB to camelCase for TS
    const normalizedConfig: any = {
      id: config.id,
      tenantId: config.tenant_id,
      isEnabled: config.is_enabled,
      plan: config.plan,
      trialEndsAt: config.trial_ends_at,
      domain: config.domain,
      theme: config.theme,
      paymentGatewayEnabled: config.payment_gateway_enabled,
      customerPortalEnabled: config.customer_portal_enabled,
      orderManagementEnabled: config.order_management_enabled
    };

    dispatch(updateTenantEcommerce({ tenantId, config: normalizedConfig }));
    return { success: true, data: normalizedConfig };
  } catch (err: any) {
    console.error('Activate Ecommerce Error:', err);
    return { success: false, error: err.message };
  }
};

export const upgradeEcommercePlan = (tenantId: string, plan: any) => async (dispatch: AppDispatch) => {
  try {
    const featureUpdates: any = { plan };
    if (plan === 'PROFESSIONAL' || plan === 'ENTERPRISE') {
      featureUpdates.payment_gateway_enabled = true;
      featureUpdates.customer_portal_enabled = true;
    }

    const { data, error } = await supabase
      .from('tenant_ecommerce')
      .update(featureUpdates)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) throw error;

    const normalizedConfig: any = {
      id: data.id,
      tenantId: data.tenant_id,
      isEnabled: data.is_enabled,
      plan: data.plan,
      trialEndsAt: data.trial_ends_at,
      domain: data.domain,
      theme: data.theme,
      paymentGatewayEnabled: data.payment_gateway_enabled,
      customer_portal_enabled: data.customer_portal_enabled,
      order_management_enabled: data.order_management_enabled
    };

    dispatch(updateTenantEcommerce({ tenantId, config: normalizedConfig }));
    return { success: true, data: normalizedConfig };
  } catch (err: any) {
    console.error('Upgrade Ecommerce Plan Error:', err);
    return { success: false, error: err.message };
  }
};

export const syncGoogleProfile = (tenantId: string) => async (dispatch: AppDispatch) => {
  try {
    // In a real app, this would call Google My Business API via a backend/Supabase Edge Function
    // Here we simulate a successful sync with mock data
    const mockConfig: GoogleBusinessConfig = {
      id: 'gbp-1',
      tenantId,
      isConnected: true,
      businessName: 'My Global Store',
      address: '123 Fashion Street, New York, NY 10001',
      phone: '+1 212-555-0198',
      email: 'contact@globalstore.com',
      website: 'https://globalstore.com',
      category: 'Clothing Store',
      description: 'Your one-stop shop for global fashion trends and premium quality apparel.',
      verificationStatus: 'VERIFIED',
      lastSyncAt: new Date().toISOString(),
      completeness: 85,
      metrics: [
        { name: 'Profile Views', value: 1240, description: 'How many saw the profile' },
        { name: 'Phone Calls', value: 45, description: 'Calls from Google' },
        { name: 'Direction Requests', value: 89, description: 'Navigation clicks' },
        { name: 'Website Clicks', value: 210, description: 'Website visits' }
      ],
      hours: [
        { day: 'Monday', open: '09:00', close: '20:00', isClosed: false },
        { day: 'Tuesday', open: '09:00', close: '20:00', isClosed: false },
        { day: 'Wednesday', open: '09:00', close: '20:00', isClosed: false },
        { day: 'Thursday', open: '09:00', close: '20:00', isClosed: false },
        { day: 'Friday', open: '09:00', close: '21:00', isClosed: false },
        { day: 'Saturday', open: '10:00', close: '21:00', isClosed: false },
        { day: 'Sunday', open: '10:00', close: '18:00', isClosed: false }
      ],
      photos: [
        { id: 'logo-1', url: 'https://images.unsplash.com/photo-1541339907198-e08756eaa93e?w=800', type: 'LOGO', isSynced: true },
        { id: 'cover-1', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200', type: 'COVER', isSynced: true }
      ],
      posts: [
        { id: 'post-1', content: 'Huge Summer Sale! Get 50% off on all items.', type: 'OFFER', publishedAt: new Date().toISOString(), status: 'LIVE' }
      ]
    };

    dispatch(updateGoogleBusinessProfile({ tenantId, config: mockConfig }));
    return { success: true, data: mockConfig };
  } catch (err: any) {
    console.error('Sync Google Profile Error:', err);
    return { success: false, error: err.message };
  }
};
