import { combineReducers } from '@reduxjs/toolkit';
import inventoryReducer from './slices/inventorySlice';
import posReducer from './slices/posSlice';
import financeReducer from './slices/financeSlice';
import laborReducer from './slices/laborSlice';
import purchaseReducer from './slices/purchaseSlice';
import tenantReducer from './slices/tenantSlice';
import authReducer from './slices/authSlice';
import settingsReducer from './slices/settingsSlice';
import vendorReducer from './slices/supplierSlice';
import uiReducer from './slices/uiSlice';

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
    ui: uiReducer,
});

const rootReducer = (state: any, action: any) => {
    if (action.type === 'auth/logout') {
        // Clear all state to initial values
        state = undefined;
    }
    return appReducer(state, action);
};

export default rootReducer;
