import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SettingsState } from '../types/settings';
import { DbRoleCode } from '../types/tenant';
import { SystemRole, AppView } from '../types/common';

const initialSettingsState: SettingsState = {
    appName: 'Enterprise Manager',
    logoUrl: '',
    primaryColor: '#4f46e5',
    enabledModules: { pos: true, inventory: true, finance: true, labor: true, purchases: true, sales: true, daily: true, storefront: true },
    rolePermissions: {
        [DbRoleCode.OWNER]: ['DASHBOARD', 'PROFIT_PULSE', 'POS', 'INVENTORY', 'PURCHASE', 'VENDORS', 'VENDOR_FORM', 'AGED_STOCK', 'FINANCE', 'SALES', 'DAILY', 'LABOR', 'STOREFRONT', 'SETTINGS', 'REPORTS', 'GROW', 'SYNC_SHARE', 'RESTORE', 'BARCODE', 'BULK_IMPORT', 'DATA_EXPORT', 'SALES_INVOICE', 'SALES_ORDER', 'ESTIMATE', 'DELIVERY_CHALLAN', 'CHALLAN_LIST', 'PAYMENT_IN', 'PAYMENT_IN_LIST', 'SALES_RETURN', 'RETURNED_ITEMS', 'INVOICE_REGISTER', 'ORDER_REGISTER', 'PURCHASE_ENTRY', 'EXPENSES', 'PURCHASE_ORDER'],
        [DbRoleCode.ADMIN]: ['DASHBOARD', 'PROFIT_PULSE', 'POS', 'INVENTORY', 'PURCHASE', 'VENDORS', 'VENDOR_FORM', 'AGED_STOCK', 'FINANCE', 'SALES', 'DAILY', 'LABOR', 'STOREFRONT', 'SETTINGS', 'REPORTS', 'GROW', 'SYNC_SHARE', 'RESTORE', 'BARCODE', 'BULK_IMPORT', 'DATA_EXPORT', 'SALES_INVOICE', 'SALES_ORDER', 'ESTIMATE', 'DELIVERY_CHALLAN', 'CHALLAN_LIST', 'PAYMENT_IN', 'PAYMENT_IN_LIST', 'SALES_RETURN', 'RETURNED_ITEMS', 'INVOICE_REGISTER', 'ORDER_REGISTER', 'PURCHASE_ENTRY', 'EXPENSES', 'PURCHASE_ORDER'],
        [DbRoleCode.MANAGER]: ['DASHBOARD', 'PROFIT_PULSE', 'POS', 'INVENTORY', 'PURCHASE', 'VENDORS', 'VENDOR_FORM', 'AGED_STOCK', 'FINANCE', 'SALES', 'DAILY', 'LABOR', 'STOREFRONT', 'REPORTS', 'SYNC_SHARE', 'BARCODE', 'DATA_EXPORT', 'SALES_INVOICE', 'SALES_ORDER', 'ESTIMATE', 'DELIVERY_CHALLAN', 'PAYMENT_IN', 'PAYMENT_IN_LIST', 'SALES_RETURN', 'RETURNED_ITEMS', 'INVOICE_REGISTER', 'ORDER_REGISTER', 'PURCHASE_ENTRY', 'EXPENSES', 'PURCHASE_ORDER'],
        [DbRoleCode.STAFF]: ['POS', 'DAILY', 'SALES', 'STOREFRONT', 'SALES_INVOICE', 'PAYMENT_IN', 'PURCHASE_ORDER']
    },
    defaultTaxMode: 'EXCLUSIVE',
    expiryRules: {
        criticalDays: 30,
        criticalDiscount: 50,
        highDays: 60,
        highDiscount: 30,
        mediumDays: 90,
        mediumDiscount: 15
    }
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState: initialSettingsState,
    reducers: {
        updateSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
            return { ...state, ...action.payload };
        },
        updateRolePermissions: (state, action: PayloadAction<{ role: SystemRole | string, views: AppView[] }>) => {
            const roleKey = action.payload.role.toLowerCase() as DbRoleCode;
            state.rolePermissions[roleKey] = action.payload.views;
        },
        resetSettings: () => initialSettingsState
    }
});

export const { updateSettings, updateRolePermissions, resetSettings } = settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;
export default settingsSlice.reducer;
