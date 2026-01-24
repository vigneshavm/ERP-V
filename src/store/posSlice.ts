
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PaymentMethod, TaxMode, } from '../types/common';
import { POSState, Sale, Customer } from '../types/sales';
import { CartItem, Session, SaleStatus, PaymentStatus } from '../types/sales';

export interface HeldBill {
  id: string;
  timestamp: number;
  cart: CartItem[];
  customerId: string; // Store ID to reconnect
  customerName?: string; // Cache name for display
  note?: string;
  total: number;
}



const defaultSession: Session = {
  id: '1',
  label: 'Tab 1',
  cart: [],
  customerId: 'c1',
  counterId: 'C1',
  taxMode: 'EXCLUSIVE',
  paymentMethod: 'CASH'
};

const initialState: POSState = {
  sessions: [defaultSession],
  activeSessionIndex: 0,
  customers: [
    { id: 'c1', name: 'Walk-in Customer', phone: '', points: 0, creditBalance: 0, creditLimit: 0, riskScore: 10 },
    { id: 'c2', name: 'John Doe', phone: '9876543210', points: 120, creditBalance: 2500, creditLimit: 5000, riskScore: 50, lastPaymentDate: '2023-10-15' },
    { id: 'c3', name: 'Rahul Enterprise', phone: '9988776655', points: 500, creditBalance: 12000, creditLimit: 10000, riskScore: 90, lastPaymentDate: '2023-08-01' },
    { id: 'c4', name: 'Alice Baker', phone: '5551234567', points: 50, creditBalance: 0, creditLimit: 2000, riskScore: 10 },
  ],
  salesHistory: [],
  activeCounterId: 'C1',
  heldBills: [] as HeldBill[] // Using the locally defined interface
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
    addSession: (state) => {
      if (state.sessions.length < 4) {
        // Find max ID effectively, filtering out NaNs
        const currentIds = state.sessions.map(s => parseInt(s.id)).filter(id => !isNaN(id));
        const maxId = currentIds.length > 0 ? Math.max(...currentIds) : 0;
        const nextId = (maxId + 1).toString();

        const newSession: Session = {
          ...defaultSession,
          id: nextId,
          label: `Tab ${nextId}`,
          cart: [],
          customerId: 'c1',
          counterId: state.activeCounterId || 'C1'
        };
        state.sessions.push(newSession);
        state.activeSessionIndex = state.sessions.length - 1;
      }
    },
    removeSession: (state, action: PayloadAction<number>) => {
      if (state.sessions.length > 1) {
        const index = action.payload;
        state.sessions.splice(index, 1);
        // Adjust active index
        if (state.activeSessionIndex >= state.sessions.length) {
          state.activeSessionIndex = state.sessions.length - 1;
        } else if (state.activeSessionIndex > index) {
          state.activeSessionIndex -= 1;
        }
      }
    },
    setActiveCounter: (state, action: PayloadAction<string>) => {
      state.activeCounterId = action.payload;
      if (state.sessions[state.activeSessionIndex]) {
        state.sessions[state.activeSessionIndex].counterId = action.payload;
      }
    },
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const session = state.sessions[state.activeSessionIndex];
      const existingIndex = session.cart.findIndex(item => item.sku === action.payload.sku);

      if (existingIndex !== -1) {
        // Move to top and update qty
        const [existingItem] = session.cart.splice(existingIndex, 1);
        existingItem.qty += action.payload.qty;
        session.cart.unshift(existingItem);
      } else {
        // Add new to top
        session.cart.unshift({
          ...action.payload,
          cutLength: action.payload.unit === 'Meter' ? (action.payload.cutLength || 1) : undefined
        });
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
    updateCartLength: (state, action: PayloadAction<{ id: string; length: number }>) => {
      const session = state.sessions[state.activeSessionIndex];
      const item = session.cart.find(i => i.id === action.payload.id);
      if (item && action.payload.length > 0) {
        item.cutLength = action.payload.length;
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

      // Clear session
      session.cart = [];
      session.customerId = 'c1';
      session.paymentMethod = 'CASH';
      session.taxMode = 'EXCLUSIVE';
    },
    updateSaleStatus: (state, action: PayloadAction<{ id: string, status: SaleStatus, paymentStatus?: PaymentStatus }>) => {
      const sale = state.salesHistory.find(s => s.id === action.payload.id);
      if (sale) {
        sale.status = action.payload.status;
        if (action.payload.paymentStatus) {
          sale.paymentStatus = action.payload.paymentStatus;
        }
      }
    },
    setCustomer: (state, action: PayloadAction<string>) => {
      state.sessions[state.activeSessionIndex].customerId = action.payload;
    },
    setTaxMode: (state, action: PayloadAction<TaxMode>) => {
      state.sessions[state.activeSessionIndex].taxMode = action.payload;
    },
    setPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.sessions[state.activeSessionIndex].paymentMethod = action.payload;
    },
    setRedeemedPoints: (state, action: PayloadAction<number>) => {
      state.sessions[state.activeSessionIndex].redeemedPoints = action.payload;
    },
    setCustomersList: (state, action: PayloadAction<Customer[]>) => {
      state.customers = action.payload;
    },
    addCustomer: (state, action: PayloadAction<Customer>) => {
      state.customers.push(action.payload);
    },
    updateCustomerPoints: (state, action: PayloadAction<{ id: string, points: number }>) => {
      const customer = state.customers.find(c => c.id === action.payload.id);
      if (customer) {
        customer.points += action.payload.points;
      }
    },
    setSalesHistory: (state, action: PayloadAction<Sale[]>) => {
      state.salesHistory = action.payload;
    },
    // Queue / Hold Bill Actions
    holdCurrentBill: (state, action: PayloadAction<{ note?: string }>) => {
      const session = state.sessions[state.activeSessionIndex];
      if (session.cart.length === 0) return;

      const customer = state.customers.find(c => c.id === session.customerId);
      const total = session.cart.reduce((sum, item) => sum + (item.price * (item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty)), 0);

      const heldBill: HeldBill = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        cart: [...session.cart],
        customerId: session.customerId,
        customerName: customer ? customer.name : 'Unknown',
        note: action.payload.note,
        total
      };

      //  - Dynamic property addition if type is strict, otherwise need to update POSState interface
      state.heldBills = [heldBill, ...(state.heldBills || [])];

      // Clear Session
      session.cart = [];
      session.customerId = 'c1';
    },
    resumeBill: (state, action: PayloadAction<string>) => {
      const index = (state.heldBills || []).findIndex(b => b.id === action.payload);
      if (index !== -1) {
        const bill = state.heldBills![index];
        const session = state.sessions[state.activeSessionIndex];

        // Restore State
        session.cart = [...bill.cart];
        session.customerId = bill.customerId;

        // Remove from Queue
        state.heldBills!.splice(index, 1);
      }
    },
    discardHeldBill: (state, action: PayloadAction<string>) => {
      state.heldBills = (state.heldBills || []).filter(b => b.id !== action.payload);
    }
  }
});

export const { setActiveSession, addSession, removeSession, setActiveCounter, addToCart, removeFromCart, updateCartQty, updateCartLength, clearCart, recordSale, setCustomer, setTaxMode, setPaymentMethod, setRedeemedPoints, setCustomersList, addCustomer, updateCustomerPoints, setSalesHistory, updateSaleStatus, holdCurrentBill, resumeBill, discardHeldBill } = posSlice.actions;
export default posSlice.reducer;
