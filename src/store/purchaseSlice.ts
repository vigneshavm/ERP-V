import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PurchaseState, PurchaseOrder } from '../types/purchase';
import { APP_CONFIG } from '../../config';
import { MOCK_ORDERS } from '../../mockData';
import { loadState, saveState } from './storage';

const initialPurchaseState: PurchaseState = {
  orders: APP_CONFIG.IS_DEMO ? MOCK_ORDERS : [],
  pendingInvoice: null,
  isProcessing: false,
};

const purchaseSlice = createSlice({
  name: 'purchase',
  initialState: loadState('purchase', initialPurchaseState),
  reducers: {
    addOrder: (state, action: PayloadAction<PurchaseOrder>) => {
      state.orders.unshift(action.payload);
      saveState('purchase', state);
    },
    approveOrder: (state, action: PayloadAction<string>) => {
      const order = state.orders.find(o => o.id === action.payload);
      if (order) order.status = 'APPROVED';
      saveState('purchase', state);
    }
  },
});

export const { addOrder, approveOrder } = purchaseSlice.actions;
export default purchaseSlice.reducer;
