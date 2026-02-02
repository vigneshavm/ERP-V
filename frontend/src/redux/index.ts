import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import { persistenceMiddleware } from './middleware/persistenceMiddleware';

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefault) => getDefault().concat(persistenceMiddleware),
});

export * from './types';

// Re-export actions for easier imports in components
export * from './slices/inventorySlice';
export * from './slices/posSlice';
export * from './slices/financeSlice';
export * from './slices/laborSlice';
export * from './slices/purchaseSlice';
export * from './slices/tenantSlice';
export * from './slices/authSlice';
export * from './slices/settingsSlice';
export * from './slices/supplierSlice';
export * from './slices/uiSlice';

// --- Thunks ---
export * from './thunks/saleThunks';
export * from './thunks/purchaseThunks';
export * from './thunks/customerThunks';
export * from './thunks/financeThunks';
export * from './thunks/tenantThunks';
