import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import customerReducer from './slices/customerSlice';
import inventoryReducer from './slices/inventorySlice';
import posReducer from './slices/posSlice';
import salesInvoiceReducer from './slices/salesInvoiceSlice';
import reportsReducer from './slices/reportsSlice';
import supplierReducer from './slices/supplierSlice';
import expenseReducer from './slices/expenseSlice';
import billReducer from './slices/billSlice';
import cashbankReducer from './slices/cashbankSlice';
import dueReducer from './slices/dueSlice';
import deliveryChallanReducer from './slices/deliveryChallanSlice';
import laborReducer from './slices/laborSlice';
import financeReducer from './slices/financeSlice';
import purchaseReducer from './slices/purchaseSlice';
import tenantReducer from './slices/tenantSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    customers: customerReducer,
    inventory: inventoryReducer,
    pos: posReducer,
    salesInvoice: salesInvoiceReducer,
    reports: reportsReducer,
    suppliers: supplierReducer,
    expense: expenseReducer,
    bill: billReducer,
    cashbank: cashbankReducer,
    due: dueReducer,
    deliveryChallan: deliveryChallanReducer,
    labor: laborReducer,
    finance: financeReducer,
    purchase: purchaseReducer,
    tenant: tenantReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;