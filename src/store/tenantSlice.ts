
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { TenantState, Tenant } from '../types/tenant'
import { ModuleType, Sector, SystemRole, AppView } from '../types/common'
import { AuthState, SettingsState } from '../types/settings'
import { Employee } from '../types/hr'

import { MOCK_TENANTS, APP_DEFAULTS } from '../../mockData';

// --- Tenant Slice ---
const initialTenantState: TenantState = {
  tenants: MOCK_TENANTS
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState: initialTenantState,
  reducers: {
    addTenant: (state, action: PayloadAction<Tenant>) => {
      state.tenants.push(action.payload);
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
        state.tenants[index] = action.payload;
      }
    }
  }
});

export const { addTenant, toggleTenantStatus, updateTenantModules, updateTenantDetails } = tenantSlice.actions;
export default tenantSlice.reducer;

// --- Auth Slice ---
const initialAuthState: AuthState = {
  user: null,
  currentSector: APP_DEFAULTS.currentSector as Sector,
  currentBranch: 'All',
  role: APP_DEFAULTS.role as SystemRole,
  theme: APP_DEFAULTS.theme as 'light' | 'dark'
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
    setUser: (state, action: PayloadAction<Employee>) => {
      state.user = action.payload;
      state.role = action.payload.systemRole;
      state.currentSector = action.payload.sector;

      // Strict Branch Locking Logic
      if (action.payload.systemRole === 'Owner') {
        // Owners default to their home branch but CAN switch to 'All' or others
        // For convenience, let's default to 'All' if they are an Owner to give the "Super View"
        state.currentBranch = 'All';
      } else {
        // Staff/Managers are STRICTLY locked to their assigned branch
        state.currentBranch = action.payload.branchId;
      }
    },
    logout: (state) => {
      state.user = null;
      state.role = 'Staff';
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
    'Owner': ['DASHBOARD', 'PROFIT_PULSE', 'POS', 'INVENTORY', 'PURCHASE', 'FINANCE', 'SALES', 'DAILY', 'LABOR', 'STOREFRONT', 'SETTINGS'],
    'Manager': ['DASHBOARD', 'PROFIT_PULSE', 'POS', 'INVENTORY', 'PURCHASE', 'FINANCE', 'SALES', 'DAILY', 'LABOR', 'STOREFRONT'],
    'Staff': ['POS', 'DAILY', 'SALES', 'STOREFRONT']
  },
  defaultTaxMode: 'EXCLUSIVE'
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
