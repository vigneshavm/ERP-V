
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Tenant, Branch, TenantState, TenantUser, DbRoleCode } from '../types/tenant';
import { SettingsState, AuthState } from '../types/settings';
import { ModuleType, Sector, SystemRole, AppView } from '../types/common';
import { getStoredTheme } from '../utils/theme'



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
    }
  }
});

export const { addTenant, toggleTenantStatus, updateTenantModules, updateTenantDetails, setTenants, updateBranchSettings, setBranches, ensureBranchRecorded, incrementCounterBillNumber, setRoles } = tenantSlice.actions;
export default tenantSlice.reducer;

// --- Auth Slice ---
const initialAuthState: AuthState = {
  user: null,
  currentSector: Sector.GENERAL,
  currentBranch: 'All',
  role: 'Staff',
  theme: getStoredTheme() || 'light'
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
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
        return;
      }
      state.user = action.payload;
      state.role = action.payload.systemRole;
      state.currentSector = action.payload.sector;
      state.currentBranch = 'All';
    },
    logout: (state) => {
      state.user = null;
      state.role = 'Staff';
      state.currentBranch = 'All';
    }
  }
});

export const { setTheme, setSector, setBranch, setUser, logout } = authSlice.actions;
export const authReducer = authSlice.reducer;

// --- Settings Slice ---
const initialSettingsState: SettingsState = {
  appName: 'Enterprise Manager',
  primaryColor: '#4f46e5',
  enabledModules: { pos: true, inventory: true, finance: true, labor: true, purchases: true, sales: true, daily: true, storefront: true },
  rolePermissions: {
    [DbRoleCode.OWNER]: ['DASHBOARD', 'PROFIT_PULSE', 'POS', 'INVENTORY', 'PURCHASE', 'VENDORS', 'AGED_STOCK', 'FINANCE', 'SALES', 'DAILY', 'LABOR', 'STOREFRONT', 'SETTINGS', 'REPORTS'],
    [DbRoleCode.ADMIN]: ['DASHBOARD', 'PROFIT_PULSE', 'POS', 'INVENTORY', 'PURCHASE', 'VENDORS', 'AGED_STOCK', 'FINANCE', 'SALES', 'DAILY', 'LABOR', 'STOREFRONT', 'SETTINGS', 'REPORTS'],
    [DbRoleCode.MANAGER]: ['DASHBOARD', 'PROFIT_PULSE', 'POS', 'INVENTORY', 'PURCHASE', 'VENDORS', 'AGED_STOCK', 'FINANCE', 'SALES', 'DAILY', 'LABOR', 'STOREFRONT', 'REPORTS'],
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
