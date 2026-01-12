import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import { persistenceMiddleware } from './middleware/persistenceMiddleware';

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefault) => getDefault().concat(persistenceMiddleware),
});

export * from './types';

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
