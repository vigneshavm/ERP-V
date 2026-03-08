import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveTab } from '../redux/slices/uiSlice';
import { RootState } from '../redux/store';

export const useTabSync = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const { activeTab } = useSelector((state: RootState) => state.ui);

    useEffect(() => {
        const path = location.pathname;
        const searchParams = new URLSearchParams(location.search);
        const tabParam = searchParams.get('tab');

        if (path === '/') {
            if (tabParam) {
                if (activeTab !== 'SETTINGS') dispatch(setActiveTab('SETTINGS'));
            } else if (activeTab === 'DASHBOARD' || !activeTab) {
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
        } else if (path.startsWith('/finance/sms-tracker')) {
            if (activeTab !== 'SMS_TRACKER') dispatch(setActiveTab('SMS_TRACKER'));
        } else if (path.startsWith('/finance/budget-tracker')) {
            if (activeTab !== 'BUDGET_TRACKER') dispatch(setActiveTab('BUDGET_TRACKER'));
        }
    }, [location.pathname, location.search, dispatch, activeTab]);
};
