import { combineReducers } from '@reduxjs/toolkit';
import inventoryReducer from './inventorySlice';
import posReducer from './posSlice';
import financeReducer from './financeSlice';
import laborReducer from './laborSlice';
import purchaseReducer from './purchaseSlice';
import tenantReducer from './tenantSlice';
import authReducer from './authSlice';
import settingsReducer from './settingsSlice';
import vendorReducer from './vendorSlice';
import uiReducer from './uiSlice';

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
