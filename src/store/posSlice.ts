
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { POSState, CartItem, Sale, Session, TaxMode, PaymentMethod, Customer } from '../types';

const defaultSession: Session = {
  id: '1',
  label: 'Tab 1',
  cart: [],
  customerId: 'c1',
  taxMode: 'EXCLUSIVE',
  paymentMethod: 'CASH'
};

const initialState: POSState = {
  sessions: [defaultSession, { ...defaultSession, id: '2', label: 'Tab 2' }, { ...defaultSession, id: '3', label: 'Tab 3' }, { ...defaultSession, id: '4', label: 'Tab 4' }],
  activeSessionIndex: 0,
  customers: [
    { id: 'c1', name: 'Walk-in Customer', phone: '', points: 0, creditBalance: 0, creditLimit: 0, riskScore: 'LOW' },
    { id: 'c2', name: 'John Doe', phone: '9876543210', points: 120, creditBalance: 2500, creditLimit: 5000, riskScore: 'MEDIUM', lastPaymentDate: '2023-10-15' },
    { id: 'c3', name: 'Rahul Enterprise', phone: '9988776655', points: 500, creditBalance: 12000, creditLimit: 10000, riskScore: 'HIGH', lastPaymentDate: '2023-08-01' },
    { id: 'c4', name: 'Alice Baker', phone: '5551234567', points: 50, creditBalance: 0, creditLimit: 2000, riskScore: 'LOW' },
  ],
  salesHistory: []
};

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    setActiveSession: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.sessions.length) {
        state.activeSessionIndex = action.payload;
      }
    },
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const session = state.sessions[state.activeSessionIndex];
      const existing = session.cart.find(item => item.sku === action.payload.sku);
      if (existing) {
        existing.qty += action.payload.qty;
      } else {
        session.cart.push({ ...action.payload });
      }
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      const session = state.sessions[state.activeSessionIndex];
      session.cart = session.cart.filter(item => item.id !== action.payload);
    },
    updateCartQty: (state, action: PayloadAction<{ id: string; qty: number }>) => {
      const session = state.sessions[state.activeSessionIndex];
      const item = session.cart.find(i => i.id === action.payload.id);
      if (item && action.payload.qty > 0) {
        item.qty = action.payload.qty;
      }
    },
    clearCart: (state) => {
      const session = state.sessions[state.activeSessionIndex];
      session.cart = [];
      session.customerId = 'c1';
    },
    recordSale: (state, action: PayloadAction<Sale>) => {
      state.salesHistory.unshift(action.payload);
      const session = state.sessions[state.activeSessionIndex];

      // Update points and Credit Balance (Khata)
      if (action.payload.customerId) {
        const customer = state.customers.find(c => c.id === action.payload.customerId);
        if (customer) {
          customer.points += Math.floor(action.payload.total / 10);

          // If Payment Method is implied 'CREDIT' (Not currently in Enum, but logic placeholder)
          // Or update strictly based on custom logic. For now, assume Credit if flagged (future enhancement).
        }
      }

      // Clear session
      session.cart = [];
      session.customerId = 'c1';
      session.paymentMethod = 'CASH';
      session.taxMode = 'EXCLUSIVE';
    },
    setCustomer: (state, action: PayloadAction<string>) => {
      state.sessions[state.activeSessionIndex].customerId = action.payload;
    },
    setTaxMode: (state, action: PayloadAction<TaxMode>) => {
      state.sessions[state.activeSessionIndex].taxMode = action.payload;
    },
    setPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.sessions[state.activeSessionIndex].paymentMethod = action.payload;
    }
  }
});

export const { setActiveSession, addToCart, removeFromCart, updateCartQty, clearCart, recordSale, setCustomer, setTaxMode, setPaymentMethod } = posSlice.actions;
export default posSlice.reducer;
