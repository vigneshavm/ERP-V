
import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, Sale, CartItem, Customer, Transaction, Employee, Attendance, PurchaseOrder, Sector, Branch, BillSession, TaxMode, PaymentMethod, Cheque, LaborPayment } from './types';
import { APP_CONFIG } from './config';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_EMPLOYEES, MOCK_TRANSACTIONS, MOCK_CHEQUES, MOCK_SALES, MOCK_ORDERS, MOCK_LABOR_PAYMENTS } from './mockData';

// --- LocalStorage Helpers ---
const loadState = (key: string, defaultState: any) => {
  try {
    const serialized = localStorage.getItem(key);
    if (serialized) {
        return JSON.parse(serialized);
    }
    // If no local storage, and DEMO mode is on, return mock data merged with default structure
    if (APP_CONFIG.IS_DEMO) {
        return defaultState; 
    }
    return defaultState;
  } catch (e) {
    return defaultState;
  }
};

const saveState = (key: string, state: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.warn("Could not save state", e);
  }
};

// --- Auth Slice ---
interface AuthState {
  currentSector: Sector;
  currentBranch: Branch;
  user: string;
  role: string;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
}

const initialAuthState: AuthState = {
  currentSector: 'Textile', // Default to Textile to show product types immediately
  currentBranch: 'Alpha',
  user: 'Admin',
  role: 'Owner',
  isAuthenticated: false,
  theme: 'dark', 
};

const authSlice = createSlice({
  name: 'auth',
  initialState: loadState('auth', initialAuthState),
  reducers: {
    setSector: (state, action: PayloadAction<Sector>) => {
      state.currentSector = action.payload;
      saveState('auth', state);
    },
    setBranch: (state, action: PayloadAction<Branch>) => {
      state.currentBranch = action.payload;
      saveState('auth', state);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveState('auth', state);
    },
    login: (state, action: PayloadAction<{ user: string; role: string }>) => {
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      saveState('auth', state);
    },
    logout: (state) => {
      state.user = '';
      state.role = '';
      state.isAuthenticated = false;
      saveState('auth', state);
    }
  },
});

// --- Inventory Slice ---
interface InventoryState {
  products: Product[];
}

// Initial state logic: Use Mock if Demo and LS is empty
const initialInventoryState: InventoryState = {
  products: APP_CONFIG.IS_DEMO ? MOCK_PRODUCTS : []
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: loadState('inventory', initialInventoryState),
  reducers: {
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.push(action.payload);
      saveState('inventory', state);
    },
    updateStock: (state, action: PayloadAction<{ id: string; qty: number }>) => {
      const p = state.products.find(p => p.id === action.payload.id);
      if (p) p.stock = action.payload.qty;
      saveState('inventory', state);
    },
    deductStock: (state, action: PayloadAction<{ id: string; qty: number }>) => {
      const p = state.products.find(p => p.id === action.payload.id);
      if (p) p.stock = Math.max(0, p.stock - action.payload.qty);
      saveState('inventory', state);
    },
    addStockBulk: (state, action: PayloadAction<{ sku: string; qty: number; cost: number; price?: number; name: string; sector: Sector; branch: Branch; category?: string; productType?: string; barcode?: string }[]>) => {
        action.payload.forEach(item => {
            const existing = state.products.find(p => p.sku === item.sku && p.sector === item.sector && p.branch === item.branch);
            if (existing) {
                existing.stock += item.qty;
                existing.cost = item.cost;
                if (item.price) existing.price = item.price;
            } else {
                state.products.push({
                    id: Math.random().toString(36).substr(2, 9),
                    sku: item.sku || `SKU-${Math.random().toString(36).substr(2, 5)}`,
                    name: item.name,
                    productType: item.productType || 'General',
                    category: item.category || 'Uncategorized',
                    price: item.price || item.cost * 1.5,
                    cost: item.cost,
                    stock: item.qty,
                    sector: item.sector,
                    branch: item.branch,
                    barcode: item.barcode || Math.floor(100000000000 + Math.random() * 900000000000).toString()
                });
            }
        });
        saveState('inventory', state);
    }
  },
});

// --- POS Slice ---
const createSession = (id: number): BillSession => ({
  id,
  label: `Bill ${id + 1}`,
  cart: [],
  customerId: null,
  taxMode: 'EXCLUSIVE',
  paymentMethod: 'CASH'
});

interface POSState {
  sessions: BillSession[];
  activeSessionIndex: number;
  customers: Customer[];
  salesHistory: Sale[];
}

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

// --- Finance Slice ---
interface FinanceState {
  transactions: Transaction[];
  cheques: Cheque[];
  bankBalance: number;
}

const initialFinanceState: FinanceState = {
  transactions: APP_CONFIG.IS_DEMO ? MOCK_TRANSACTIONS : [],
  cheques: APP_CONFIG.IS_DEMO ? MOCK_CHEQUES : [],
  bankBalance: 250000, // Higher default for demo
};

const financeSlice = createSlice({
  name: 'finance',
  initialState: loadState('finance', initialFinanceState),
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
      if (action.payload.type === 'INCOME') {
        state.bankBalance += action.payload.amount;
      } else {
        state.bankBalance -= action.payload.amount;
      }
      saveState('finance', state);
    },
    addCheque: (state, action: PayloadAction<Cheque>) => {
      state.cheques.push(action.payload);
      saveState('finance', state);
    },
    updateChequeStatus: (state, action: PayloadAction<{id: string, status: 'CLEARED' | 'BOUNCED'}>) => {
      const cheque = state.cheques.find(c => c.id === action.payload.id);
      if (cheque && cheque.status === 'PENDING') {
        cheque.status = action.payload.status;
        
        // If cleared, adjust balance
        if (action.payload.status === 'CLEARED') {
           if (cheque.type === 'RECEIVED') {
             state.bankBalance += cheque.amount;
             state.transactions.unshift({
               id: Math.random().toString(36).substr(2, 9),
               type: 'INCOME',
               category: 'Cheque Cleared',
               amount: cheque.amount,
               date: new Date().toISOString(),
               description: `Cheque Received: ${cheque.number}`,
               sector: cheque.sector,
               branch: 'Alpha' // Default
             });
           } else {
             state.bankBalance -= cheque.amount;
             state.transactions.unshift({
              id: Math.random().toString(36).substr(2, 9),
              type: 'EXPENSE',
              category: 'Cheque Cleared',
              amount: cheque.amount,
              date: new Date().toISOString(),
              description: `Cheque Issued: ${cheque.number}`,
              sector: cheque.sector,
              branch: 'Alpha' // Default
            });
           }
        }
      }
      saveState('finance', state);
    }
  },
});

// --- Purchase Slice ---
interface PurchaseState {
  orders: PurchaseOrder[];
}

const initialPurchaseState: PurchaseState = {
  orders: APP_CONFIG.IS_DEMO ? MOCK_ORDERS : [],
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

// --- Labor Slice ---
interface LaborState {
  employees: Employee[];
  attendance: Attendance[];
  payments: LaborPayment[];
}

const initialLaborState: LaborState = {
  employees: APP_CONFIG.IS_DEMO ? MOCK_EMPLOYEES : [],
  attendance: [],
  payments: APP_CONFIG.IS_DEMO ? MOCK_LABOR_PAYMENTS : [],
};

const laborSlice = createSlice({
  name: 'labor',
  initialState: loadState('labor', initialLaborState),
  reducers: {
    addEmployee: (state, action: PayloadAction<Employee>) => {
      state.employees.push(action.payload);
      saveState('labor', state);
    },
    markAttendance: (state, action: PayloadAction<Attendance>) => {
      // Remove existing for same day/person if any
      state.attendance = state.attendance.filter(a => !(a.employeeId === action.payload.employeeId && a.date === action.payload.date));
      state.attendance.push(action.payload);
      saveState('labor', state);
    },
    addLaborPayment: (state, action: PayloadAction<LaborPayment>) => {
      state.payments.push(action.payload);
      saveState('labor', state);
    }
  },
});

// --- Store Configuration ---
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    inventory: inventorySlice.reducer,
    pos: posSlice.reducer,
    finance: financeSlice.reducer,
    purchase: purchaseSlice.reducer,
    labor: laborSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const { setSector, setBranch, toggleTheme, login, logout } = authSlice.actions;
export const { addProduct, deductStock, addStockBulk } = inventorySlice.actions;
export const { 
    addToCart, updateCartQty, removeFromCart, clearCurrentSession, 
    setCustomer, addCustomer, recordSale, 
    setActiveSession, setTaxMode, setPaymentMethod 
} = posSlice.actions;
export const { addTransaction, addCheque, updateChequeStatus } = financeSlice.actions;
export const { addOrder, approveOrder } = purchaseSlice.actions;
export const { addEmployee, markAttendance, addLaborPayment } = laborSlice.actions;

export const processSale = (sale: Sale) => (dispatch: AppDispatch) => {
  dispatch(recordSale(sale));
  sale.items.forEach(item => {
    dispatch(deductStock({ id: item.id, qty: item.qty }));
  });
  dispatch(addTransaction({
    id: Math.random().toString(36).substr(2, 9),
    type: 'INCOME',
    category: 'Sales',
    amount: sale.total,
    date: sale.date,
    description: `Sale #${sale.id.substr(0, 6)} - ${sale.branch} (${sale.paymentMethod})`,
    sector: sale.sector,
    branch: sale.branch
  }));
  dispatch(clearCurrentSession());
};

export const processPurchaseApproval = (order: PurchaseOrder) => (dispatch: AppDispatch) => {
    dispatch(approveOrder(order.id));
    dispatch(addStockBulk(order.items.map(i => ({
        sku: i.sku || 'UNKNOWN',
        qty: i.qty,
        cost: i.cost,
        price: undefined, 
        name: i.name,
        category: 'Uncategorized', // Default
        productType: 'General', // Default
        sector: order.sector,
        branch: order.branch
    }))));
    dispatch(addTransaction({
        id: Math.random().toString(36).substr(2, 9),
        type: 'EXPENSE',
        category: 'Inventory Restock',
        amount: order.total,
        date: new Date().toISOString(),
        description: `Invoice Payment - ${order.vendor} (${order.branch})`,
        sector: order.sector,
        branch: order.branch
    }));
};
