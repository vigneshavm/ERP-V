import { combineReducers } from '@reduxjs/toolkit';
import authReducer          from '@/entities/session/model/authSlice';
import tenantReducer        from '@/entities/session/model/tenantSlice';
import settingsReducer      from '@/entities/session/model/settingsSlice';
import customerReducer      from '@/entities/contact/model/customerSlice';
import supplierReducer      from '@/entities/contact/model/supplierSlice';
import supplierGroupReducer from '@/entities/contact/model/supplierGroupSlice';
import inventoryReducer     from '@/entities/inventory/model/inventorySlice';
import posReducer           from '@/entities/sales/model/posSlice';
import salesInvoiceReducer  from '@/entities/sales/model/salesInvoiceSlice';
import deliveryChallanReducer from '@/entities/sales/model/deliveryChallanSlice';
import billReducer          from '@/entities/finance/model/billSlice';
import cashbankReducer      from '@/entities/finance/model/cashbankSlice';
import financeReducer       from '@/entities/finance/model/financeSlice';
import journalEntryReducer  from '@/entities/finance/model/journalEntrySlice';
import purchaseReducer      from '@/entities/purchase/model/purchaseSlice';
import paymentOutReducer    from '@/entities/purchase/model/paymentOutSlice';
import laborReducer         from '@/entities/people/model/laborSlice';
import payrollReducer       from '@/entities/people/model/payrollSlice';
import systemReducer        from '@/entities/system/model/systemSlice';
import expenseReducer       from '@/features/expense-tracking/model/expenseSlice';
import dueReducer           from '@/features/expense-tracking/model/dueSlice';
import reportsReducer       from '@/widgets/stats-dashboard/model/reportsSlice';

const appReducer = combineReducers({
    auth:           authReducer,
    tenant:         tenantReducer,
    settings:       settingsReducer,
    customers:      customerReducer,
    suppliers:      supplierReducer,
    supplierGroups: supplierGroupReducer,
    inventory:      inventoryReducer,
    pos:            posReducer,
    salesInvoice:   salesInvoiceReducer,
    deliveryChallan:deliveryChallanReducer,
    bill:           billReducer,
    cashbank:       cashbankReducer,
    finance:        financeReducer,
    journalEntry:   journalEntryReducer,
    purchase:       purchaseReducer,
    paymentOut:     paymentOutReducer,
    labor:          laborReducer,
    payroll:        payrollReducer,
    system:         systemReducer,
    expense:        expenseReducer,
    due:            dueReducer,
    reports:        reportsReducer,
});

const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: { type: string }) => {
    // Wipe all state on logout so no tenant data bleeds between sessions
    if (action.type === 'auth/logout') {
        state = undefined;
    }
    return appReducer(state, action);
};

export default rootReducer;
