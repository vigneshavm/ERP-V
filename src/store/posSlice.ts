import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { POSState, Sale, CartItem, Customer, BillSession, TaxMode, PaymentMethod } from '../types';
import { APP_CONFIG } from '../../config';
import { MOCK_CUSTOMERS, MOCK_SALES } from '../../mockData';
import { loadState, saveState } from './storage';

const createSession = (id: number): BillSession => ({
  id,
  label: `Bill ${id + 1}`,
  cart: [],
  customerId: null,
  taxMode: 'EXCLUSIVE',
  paymentMethod: 'CASH'
});

const initialPOSState: POSState = {
  sessions: [createSession(0), createSession(1), createSession(2), createSession(3)],
  activeSessionIndex: 0,
  customers: APP_CONFIG.IS_DEMO ? MOCK_CUSTOMERS : [{ id: 'c1', name: 'Walk-in Customer', phone: '000-000-0000', points: 0 }],
  salesHistory: APP_CONFIG.IS_DEMO ? MOCK_SALES : [],
};

const posSlice = createSlice({
  name: 'pos',
  initialState: loadState('pos', initialPOSState),
  reducers: {
    setActiveSession: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < 4) {
        state.activeSessionIndex = action.payload;
        saveState('pos', state);
      }
    },
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const session = state.sessions[state.activeSessionIndex];
      const existing = session.cart.find(item => item.id === action.payload.id);
      if (existing) {
        existing.qty += 1;
      } else {
        session.cart.push({ ...action.payload, qty: 1 });
      }
      saveState('pos', state);
    },
    updateCartQty: (state, action: PayloadAction<{ id: string; qty: number }>) => {
      const session = state.sessions[state.activeSessionIndex];
      const item = session.cart.find(i => i.id === action.payload.id);
      if (item) item.qty = action.payload.qty;
      if (item && item.qty <= 0) session.cart = session.cart.filter(i => i.id !== action.payload.id);
      saveState('pos', state);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      const session = state.sessions[state.activeSessionIndex];
      session.cart = session.cart.filter(item => item.id !== action.payload);
      saveState('pos', state);
    },
    clearCurrentSession: (state) => {
      const idx = state.activeSessionIndex;
      state.sessions[idx] = createSession(idx);
      saveState('pos', state);
    },
    setCustomer: (state, action: PayloadAction<string>) => {
      state.sessions[state.activeSessionIndex].customerId = action.payload;
      saveState('pos', state);
    },
    setTaxMode: (state, action: PayloadAction<TaxMode>) => {
      state.sessions[state.activeSessionIndex].taxMode = action.payload;
      saveState('pos', state);
    },
    setPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.sessions[state.activeSessionIndex].paymentMethod = action.payload;
      saveState('pos', state);
    },
    addCustomer: (state, action: PayloadAction<Customer>) => {
      state.customers.push(action.payload);
      saveState('pos', state);
    },
    recordSale: (state, action: PayloadAction<Sale>) => {
      state.salesHistory.unshift(action.payload);
      if (action.payload.customerId) {
        const cust = state.customers.find(c => c.id === action.payload.customerId);
        if (cust) {
          cust.points += Math.floor(action.payload.total * 0.01);
        }
      }
      saveState('pos', state);
    }
  },
});

export const {
  addToCart, updateCartQty, removeFromCart, clearCurrentSession,
  setCustomer, addCustomer, recordSale,
  setActiveSession, setTaxMode, setPaymentMethod
} = posSlice.actions;
export default posSlice.reducer;
