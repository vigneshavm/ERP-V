import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab } from '../redux/slices/uiSlice';
import { RootState } from '../redux/store';
import { MENU_ITEMS, MenuItem } from '../config/menu.config';
import { AppView } from '../types/common';

// Helper to flatten menu items to search by path
const flattenMenu = (items: MenuItem[]): MenuItem[] => {
    return items.reduce((acc: MenuItem[], item) => {
        acc.push(item);
        if (item.children) {
            acc.push(...flattenMenu(item.children));
        }
        return acc;
    }, []);
};
export const useTabSync = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const { activeTab } = useSelector((state: RootState) => state.ui);

    useEffect(() => {
        const path = location.pathname;
        const searchParams = new URLSearchParams(location.search);
        const tabParam = searchParams.get('tab');

        if (tabParam) {
            // 1. Explicit ?tab parameter takes priority
            if (activeTab !== tabParam) dispatch(setActiveTab(tabParam as AppView));
            return;
        }

        // 2. Dynamic Path Resolution via Menu Config
        const allItems = flattenMenu(MENU_ITEMS);
        // We match exact paths first
        const matchedItem = allItems.find(item => item.path && item.path === path);
        
        if (matchedItem) {
            if (activeTab !== matchedItem.id) {
                dispatch(setActiveTab(matchedItem.id));
            }
            return;
        }

        // 3. Fallback to dynamic URL manual overrides (for IDs like /finance/ledger/123)
        if (path === '/') {
            if (activeTab === 'DASHBOARD' || !activeTab) {
                dispatch(setActiveTab('DASHBOARD'));
            }

        } else if (path.startsWith('/people/payroll')) {
            if (path.includes('/structure')) {
                if (activeTab !== 'PAYROLL') dispatch(setActiveTab('PAYROLL'));
            } else if (path.includes('/attendance')) {
                if (activeTab !== 'ATTENDANCE_SUMMARY') dispatch(setActiveTab('ATTENDANCE_SUMMARY'));
            } else {
                if (activeTab !== 'PAYROLL') dispatch(setActiveTab('PAYROLL'));
            }
        } else if (path.startsWith('/people/employees')) {
            if (path.includes('/allowances')) {
                if (activeTab !== 'ALLOWANCE_MANAGER') dispatch(setActiveTab('ALLOWANCE_MANAGER'));
            } else {
                if (activeTab !== 'STAFF_MANAGER') dispatch(setActiveTab('STAFF_MANAGER'));
            }
        } else if (path.startsWith('/people/attendance')) {
            if (activeTab !== 'ATTENDANCE_BOARD') dispatch(setActiveTab('ATTENDANCE_BOARD'));
        } else if (path === '/purchase/orders/new') {
            if (activeTab !== 'PURCHASE_ORDER_FORM') dispatch(setActiveTab('PURCHASE_ORDER_FORM'));
        } else if (path.startsWith('/purchase/orders/')) {
            if (activeTab !== 'PURCHASE_ORDER_DETAILS') dispatch(setActiveTab('PURCHASE_ORDER_DETAILS'));
        } else if (path.startsWith('/finance/sms-tracker')) {
            if (activeTab !== 'SMS_TRACKER') dispatch(setActiveTab('SMS_TRACKER'));
        } else if (path.startsWith('/finance/budget-tracker')) {
            if (activeTab !== 'BUDGET_TRACKER') dispatch(setActiveTab('BUDGET_TRACKER'));
        }
    }, [location.pathname, location.search, dispatch, activeTab]);
};
