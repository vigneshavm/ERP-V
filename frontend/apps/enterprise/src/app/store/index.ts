import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';
import { persistenceMiddleware } from './middleware/persistenceMiddleware';

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefault) => getDefault().concat(persistenceMiddleware),
});

export * from './types';

// Re-export actions for easier imports in components
export * from '@/entities/inventory/model/inventorySlice';
export * from '@/entities/sales/model/posSlice';
export * from '@/entities/finance/model/financeSlice';
export * from '@/entities/people/model/laborSlice';
export * from '@/entities/purchase/model/purchaseSlice';
export * from '@/entities/session/model/tenantSlice';
export * from '@/entities/session/model/authSlice';
export * from './slices/settingsSlice';
export * from '@/entities/contact/model/supplierSlice';
export * from '@/entities/system/model/systemSlice';

// --- Thunks ---
export * from './thunks/saleThunks';
export * from './thunks/purchaseThunks';
export * from './thunks/customerThunks';
export * from './thunks/financeThunks';
export * from './thunks/tenantThunks';
