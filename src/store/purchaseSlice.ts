import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PurchaseState, PurchaseOrder } from '../types/purchase';
import { APP_CONFIG } from '../config';

import { loadState, saveState } from './storage';

const initialPurchaseState: PurchaseState = {
  orders: [],
  pendingInvoice: null,
  isProcessing: false,
};

const purchaseSlice = createSlice({
  name: 'purchase',
  initialState: loadState('purchase', initialPurchaseState),
  reducers: {
    addOrder: (state, action: PayloadAction<PurchaseOrder>) => {
      state.orders.unshift(action.payload);
    },
    approveOrder: (state, action: PayloadAction<string>) => {
      const order = state.orders.find(o => o.id === action.payload);
      if (order) order.status = 'APPROVED';
    },
    setOrders: (state, action: PayloadAction<PurchaseOrder[]>) => {
      state.orders = action.payload;
    }
  },
});

export const { addOrder, approveOrder, setOrders } = purchaseSlice.actions;
export default purchaseSlice.reducer;
