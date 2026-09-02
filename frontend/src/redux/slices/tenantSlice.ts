import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Tenant, TenantState, TenantEcommerceConfig, GoogleBusinessConfig } from "../../types/tenant";
import { SettingsState } from "../../types/settings";
import { ModuleType } from "../../types/common";
import api from "../../services/api";

const SETTINGS_API_URL = "/api/settings";

const getAuthConfig = (token: string) => ({
    headers: {
        Authorization: `Bearer ${token}`,
    },
});

// Load flow: MongoDB -> GET /api/settings -> Redux (tenantSlice) -> Settings UI.
// This is the DB-backed source of truth for the Settings page; it replaces the
// old behavior of hydrating purely from whatever was already in Redux/mocks.
export const fetchTenantSettings = createAsyncThunk(
    'tenant/fetchSettings',
    async (_: void, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");

            const response = await api.get(SETTINGS_API_URL, getAuthConfig(token));
            return response.data?.data;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Save flow: Validation (Settings.tsx) -> PUT /api/settings -> Backend -> MongoDB
// -> Response -> Redux (tenantSlice). The resolved server response (not the
// optimistic local payload) is what gets merged into state, so Redux always
// reflects what was actually persisted.
export const saveTenantSettings = createAsyncThunk(
    'tenant/saveSettings',
    async (updates: Partial<Tenant>, thunkAPI) => {
        try {
            const state = thunkAPI.getState() as any;
            const token = state.auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue("Not authenticated");

            const response = await api.put(SETTINGS_API_URL, updates, getAuthConfig(token));
            if (!response.data?.success) {
                return thunkAPI.rejectWithValue(response.data?.message || "Failed to save settings");
            }
            return response.data?.data;
        } catch (error: any) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

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
                            id: `br-fallback-${loc.city.toLowerCase()}-${rawTenant.id}`,
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

            if (action.payload.locations) {
                for (const loc of action.payload.locations) {
                    const branches = loc.branches || [];
                    if (branches.length === 0) {
                        const fallbackId = `br-fallback-${loc.city.toLowerCase()}-${action.payload.id}`;
                        const exists = state.branches.find(sb => sb.id === fallbackId);
                        if (!exists) {
                            state.branches.push({
                                id: fallbackId,
                                tenantId: action.payload.id,
                                name: loc.city,
                                city: loc.city,
                                address: 'Main Office',
                                updatedAt: now
                            });
                        }
                    } else {
                        for (const b of branches) {
                            const exists = state.branches.find(sb => sb.id === b.id || (sb.name === b.name && sb.tenantId === action.payload.id));
                            if (!exists) {
                                state.branches.push({
                                    id: b.id || b.name,
                                    tenantId: action.payload.id,
                                    name: b.name || b.id,
                                    city: b.city || loc.city || '',
                                    address: b.address || '',
                                    updatedAt: b.updatedAt
                                });
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
        updateTenantDetails: (state, action: PayloadAction<{ id: string, updates: Partial<Tenant> }>) => {
            const index = state.tenants.findIndex(t => t.id === action.payload.id);
            if (index !== -1) {
                const now = new Date().toISOString();
                const existing = state.tenants[index];
                const merged = { ...existing, ...action.payload.updates, updatedAt: now };

                const normalizedLocations = (merged.locations || []).map(loc => {
                    if (!loc.branches || loc.branches.length === 0) {
                        return {
                            ...loc,
                            branches: [{
                                id: `br-fallback-${loc.city.toLowerCase()}-${merged.id}`,
                                name: loc.city,
                                city: loc.city,
                                address: 'Main Office',
                                updatedAt: now
                            }]
                        };
                    }
                    return loc;
                });

                state.tenants[index] = { ...merged, locations: normalizedLocations } as Tenant;
            }
        },
        setTenants: (state, action: PayloadAction<Tenant[]>) => {
            const now = new Date().toISOString();
            state.tenants = (action.payload || []).map(t => {
                const normalizedLocations = (t.locations || []).map(loc => {
                    if (!loc.branches || loc.branches.length === 0) {
                        return {
                            ...loc,
                            branches: [{
                                id: `br-fallback-${loc.city.toLowerCase()}-${t.id}`,
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

            const collected: any[] = [];
            for (const t of state.tenants) {
                if (!t.locations) continue;
                for (const loc of t.locations) {
                    const branches = loc.branches || [];
                    if (branches.length === 0) {
                        const fallbackId = `br-fallback-${loc.city.toLowerCase()}-${t.id}`;
                        const exists = state.branches.find(sb => sb.id === fallbackId) || collected.find(cb => cb.id === fallbackId);
                        if (!exists) {
                            collected.push({
                                id: fallbackId,
                                tenantId: t.id,
                                name: loc.city,
                                city: loc.city,
                                address: 'Main Office',
                                updatedAt: t.updatedAt || now
                            });
                        }
                    } else {
                        for (const b of branches) {
                            const exists = state.branches.find(sb => sb.id === b.id || (sb.name === b.name && sb.tenantId === t.id)) || collected.find(cb => cb.id === b.id || (cb.name === b.name && cb.tenantId === t.id));
                            if (!exists) {
                                collected.push({
                                    id: b.id || b.name,
                                    tenantId: t.id,
                                    name: b.name || b.id,
                                    city: b.city || loc.city || '',
                                    address: b.address || '',
                                    updatedAt: b.updatedAt
                                });
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
        ensureBranchRecorded: (state, action: PayloadAction<{ branchId: string }>) => {
            const bid = action.payload.branchId;
            if (!bid) return;
            const exists = state.branches.find(b => b.id === bid || b.name === bid);
            if (exists) return;

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
                    branch.counters.push({
                        id: action.payload.counterId,
                        name: `Counter ${action.payload.counterId}`,
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
        },
        setEcommerceEnabled: (state, action: PayloadAction<{ tenantId: string, config: TenantEcommerceConfig }>) => {
            const tenant = state.tenants.find(t => t.id === action.payload.tenantId);
            if (tenant) {
                tenant.ecommerceConfig = action.payload.config;
            }
        },
    },
    extraReducers: (builder) => {
        // Both the Load flow (fetchTenantSettings) and the Save flow
        // (saveTenantSettings) land here: the DB-authoritative tenant record
        // returned by the backend is merged onto whatever tenant is already
        // in Redux, keeping MongoDB as the source of truth and Redux as cache.
        const mergeServerTenant = (state: TenantState, data: any) => {
            if (!data || !data.id) return;
            const id = String(data.id);
            const now = new Date().toISOString();
            const index = state.tenants.findIndex(t => String(t.id) === id);
            if (index !== -1) {
                state.tenants[index] = {
                    ...state.tenants[index],
                    ...data,
                    id: state.tenants[index].id,
                    updatedAt: now
                } as Tenant;
            } else {
                state.tenants.push({ ...data, id, updatedAt: now } as Tenant);
            }
        };

        builder
            .addCase(fetchTenantSettings.fulfilled, (state, action) => {
                mergeServerTenant(state, action.payload);
            })
            .addCase(saveTenantSettings.fulfilled, (state, action) => {
                mergeServerTenant(state, action.payload);
            });
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
    updateGoogleBusinessProfile,
    setEcommerceEnabled
} = tenantSlice.actions;

export const tenantReducer = tenantSlice.reducer;
export default tenantSlice.reducer;
