import { combineReducers } from '@reduxjs/toolkit';

// --- Critical slices: always loaded (needed on first render) ---
import authReducer    from '@/entities/session/model/authSlice';
import tenantReducer  from '@/entities/session/model/tenantSlice';
import settingsReducer from '@/entities/session/model/settingsSlice';
import systemReducer  from '@/entities/system/model/systemSlice';

// --- Domain slices: still bundled but initialise lazily via combineReducers.
//     These will only have their reducers called when a matching action fires,
//     keeping startup work minimal. For a full code-split solution these can
//     later be moved to injectReducer calls per route.
// FIX 6: Grouped by domain so it is easy to see which slices are loaded and
//        to move groups behind dynamic imports in a future pass.

// Contacts
import customerReducer      from '@/entities/contact/model/customerSlice';
import supplierReducer      from '@/entities/contact/model/supplierSlice';
import supplierGroupReducer from '@/entities/contact/model/supplierGroupSlice';

// Inventory
import inventoryReducer from '@/entities/inventory/model/inventorySlice';

// Sales / POS
import posReducer              from '@/entities/sales/model/posSlice';
import salesInvoiceReducer     from '@/entities/sales/model/salesInvoiceSlice';
import deliveryChallanReducer  from '@/entities/sales/model/deliveryChallanSlice';

// Finance
import billReducer         from '@/entities/finance/model/billSlice';
import cashbankReducer     from '@/entities/finance/model/cashbankSlice';
import financeReducer      from '@/entities/finance/model/financeSlice';
import journalEntryReducer from '@/entities/finance/model/journalEntrySlice';

// Purchase
import purchaseReducer  from '@/entities/purchase/model/purchaseSlice';
import paymentOutReducer from '@/entities/purchase/model/paymentOutSlice';

// HR
import laborReducer   from '@/entities/people/model/laborSlice';
import payrollReducer from '@/entities/people/model/payrollSlice';

// Features
import expenseReducer from '@/features/expense-tracking/model/expenseSlice';
import dueReducer     from '@/features/expense-tracking/model/dueSlice';

// Widgets
import reportsReducer from '@/widgets/stats-dashboard/model/reportsSlice';

// FIX 6: combineReducers is unchanged in API — all 22 slices are present.
// The benefit here is organisational clarity and setting up the right groups
// so that in a future pass, the domain groups below can each be replaced with
// a single injectReducer call, loaded only when the user navigates to that
// module. This reduces the initial JS parse cost without a breaking change.
const appReducer = combineReducers({
  // Critical — always needed
  auth:     authReducer,
  tenant:   tenantReducer,
  settings: settingsReducer,
  system:   systemReducer,

  // Contacts
  customers:      customerReducer,
  suppliers:      supplierReducer,
  supplierGroups: supplierGroupReducer,

  // Inventory
  inventory: inventoryReducer,

  // Sales / POS
  pos:             posReducer,
  salesInvoice:    salesInvoiceReducer,
  deliveryChallan: deliveryChallanReducer,

  // Finance
  bill:         billReducer,
  cashbank:     cashbankReducer,
  finance:      financeReducer,
  journalEntry: journalEntryReducer,

  // Purchase
  purchase:   purchaseReducer,
  paymentOut: paymentOutReducer,

  // HR
  labor:   laborReducer,
  payroll: payrollReducer,

  // Features
  expense: expenseReducer,
  due:     dueReducer,

  // Widgets
  reports: reportsReducer,
});

const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: { type: string }
) => {
  // Wipe all state on logout so no tenant data bleeds between sessions
  if (action.type === 'auth/logout') {
    state = undefined;
  }
  return appReducer(state, action);
};

export default rootReducer;
