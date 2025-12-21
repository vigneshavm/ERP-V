
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TenantState, Tenant, ModuleType, AuthState, Sector, SettingsState, SystemRole, Employee, AppView } from '../types';

// --- Tenant Slice ---
const initialTenantState: TenantState = {
  tenants: [
    {
      id: '1',
      name: 'Retail Co',
      subdomain: 'retail-co',
      modules: ['POS', 'INVENTORY', 'FINANCE'],
      isActive: true,
      region: { currency: 'USD', currencySymbol: '$', dateFormat: 'MM/DD/YYYY' }
    },
    {
      id: '2',
      name: 'Pharma Plus',
      subdomain: 'pharma-plus',
      modules: ['POS', 'INVENTORY'],
      isActive: true,
      region: { currency: 'EUR', currencySymbol: '€', dateFormat: 'DD/MM/YYYY' }
    },
  ]
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
    }
  }
});

export const { addTenant, toggleTenantStatus, updateTenantModules } = tenantSlice.actions;
export default tenantSlice.reducer;

// --- Auth Slice ---
const initialAuthState: AuthState = {
  user: null,
  currentSector: Sector.GENERAL,
  currentBranch: 'Alpha',
  role: 'Staff', // Default safe role
  theme: 'light'
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
      state.currentBranch = action.payload.branch === 'All' ? 'Alpha' : action.payload.branch;
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
