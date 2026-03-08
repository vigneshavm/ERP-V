import { combineReducers } from '@reduxjs/toolkit';
import inventoryReducer from '@/entities/inventory/model/inventorySlice';
import posReducer from '@/entities/sales/model/posSlice';
import financeReducer from '@/entities/finance/model/financeSlice';
import laborReducer from '@/entities/people/model/laborSlice';
import purchaseReducer from '@/entities/purchase/model/purchaseSlice';
import tenantReducer from '@/entities/session/model/tenantSlice';
import authReducer from '@/entities/session/model/authSlice';
import settingsReducer from './slices/settingsSlice';
import vendorReducer from '@/entities/contact/model/supplierSlice';
import systemReducer from '@/entities/system/model/systemSlice';
// uiReducer is omitted as it's being migrated to Zustand

const appReducer = combineReducers({
    inventory: inventoryReducer,
    pos: posReducer,
    finance: financeReducer,
    labor: laborReducer,
    purchase: purchaseReducer,
    tenant: tenantReducer,
    auth: authReducer,
    settings: settingsReducer,
    vendor: vendorReducer,
    system: systemReducer,
});

const rootReducer = (state: any, action: any) => {
    if (action.type === 'auth/logout') {
        // Clear all state to initial values
        state = undefined;
    }
    return appReducer(state, action);
};

export default rootReducer;
