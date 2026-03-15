import { configureStore } from '@reduxjs/toolkit';

import customerReducer from '@/entities/contact/model/customerSlice';
import inventoryReducer from '@/entities/inventory/model/inventorySlice';
import posReducer from '@/entities/sales/model/posSlice';
import salesInvoiceReducer from '@/entities/sales/model/salesInvoiceSlice';
import reportsReducer from '@/widgets/stats-dashboard/model/reportsSlice';
import supplierReducer from '@/entities/contact/model/supplierSlice';
import expenseReducer from '@/features/expense-tracking/model/expenseSlice';
import billReducer from '@/entities/finance/model/billSlice';
import cashbankReducer from '@/entities/finance/model/cashbankSlice';
import dueReducer from '@/features/expense-tracking/model/dueSlice';
import deliveryChallanReducer from './slices/deliveryChallanSlice';
import laborReducer from '@/entities/people/model/laborSlice';
import financeReducer from '@/entities/finance/model/financeSlice';
import purchaseReducer from '@/entities/purchase/model/purchaseSlice';
import tenantReducer from '@/entities/session/model/tenantSlice';
import { settingsReducer } from './slices/settingsSlice';
import supplierGroupReducer from '@/entities/contact/model/supplierGroupSlice';
import paymentOutReducer from './slices/paymentOutSlice';
import journalEntryReducer from './slices/journalEntrySlice';
import payrollReducer from '@/entities/people/model/payrollSlice';
import systemReducer from '@/entities/system/model/systemSlice';
import authReducer from '@/entities/session/model/authSlice';


export const store = configureStore({
  reducer: {
    settings: settingsReducer,
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
    supplierGroups: supplierGroupReducer,
    paymentOut: paymentOutReducer,
    journalEntry: journalEntryReducer,
    payroll: payrollReducer,
    system: systemReducer,
  },
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
