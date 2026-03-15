import { configureStore } from '@reduxjs/toolkit';
import posReducer from '@/redux/slices/posSlice';

// For the MFE, we just need a minimal store
export const store = configureStore({
  reducer: {
    pos: posReducer,
    auth: (state = { user: null, currentSector: 'Retail', currentBranch: 'All' }) => state,
    inventory: (state = { items: [] }) => state,
    tenant: (state = { tenants: [] }) => state,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
