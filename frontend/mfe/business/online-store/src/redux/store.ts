import { configureStore } from '@reduxjs/toolkit';
import posReducer from '@/redux/slices/posSlice';

// For the MFE, we just need a minimal store
export const store = configureStore({
  reducer: {
    pos: posReducer,
    auth: (state = { user: null, currentSector: 'Retail', currentBranch: 'All' }) => state,
    inventory: (state = {
      items: [
        { id: '1', name: 'Premium Coffee Beans', category: 'Retail', sellingPrice: 25, stockQty: 100, sector: 'Retail', branchId: 'All' },
        { id: '2', name: 'Organic Green Tea', category: 'Retail', sellingPrice: 15, stockQty: 50, sector: 'Retail', branchId: 'All' },
        { id: '3', name: 'Artisan Dark Chocolate', category: 'Retail', sellingPrice: 12, stockQty: 0, sector: 'Retail', branchId: 'All' },
        { id: '4', name: 'Natural Honey Jar', category: 'Retail', sellingPrice: 18, stockQty: 75, sector: 'Retail', branchId: 'All' },
      ]
    }) => state,
    tenant: (state = { tenants: [] }) => state,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
