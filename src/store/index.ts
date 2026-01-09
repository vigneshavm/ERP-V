import { configureStore } from '@reduxjs/toolkit';
import inventoryReducer from './inventorySlice';
import posReducer from './posSlice';
import financeReducer from './financeSlice';
import laborReducer from './laborSlice';
import purchaseReducer from './purchaseSlice';
import tenantReducer from './tenantSlice';
import authReducer from './authSlice';
import settingsReducer from './settingsSlice';
import vendorReducer from './vendorSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
    reducer: {
        inventory: inventoryReducer,
        pos: posReducer,
        finance: financeReducer,
        labor: laborReducer,
        purchase: purchaseReducer,
        tenant: tenantReducer,
        auth: authReducer,
        settings: settingsReducer,
        vendor: vendorReducer,
        ui: uiReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Re-export actions for easier imports in components
export * from './inventorySlice';
export * from './posSlice';
export * from './financeSlice';
export * from './laborSlice';
export * from './purchaseSlice';
export * from './tenantSlice';
export * from './authSlice';
export * from './settingsSlice';
export * from './vendorSlice';
export * from './uiSlice';

// --- Thunks ---
export * from './thunks/saleThunks';
export * from './thunks/purchaseThunks';
export * from './thunks/customerThunks';
export * from './thunks/financeThunks';
export * from './thunks/tenantThunks';
