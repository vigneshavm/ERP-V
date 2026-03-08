import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUiStore } from '@/shared/lib/store/uiStore';

export const useTabSync = () => {
    const { activeTab, setActiveTab } = useUiStore();
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        const searchParams = new URLSearchParams(location.search);
        const tabParam = searchParams.get('tab');

        if (path === '/') {
            if (tabParam) {
                if (activeTab !== 'SETTINGS') setActiveTab('SETTINGS');
            } else if (activeTab === 'DASHBOARD' || !activeTab) {
                setActiveTab('DASHBOARD');
            }
        } else if (path.startsWith('/people/payroll')) {
            if (path.includes('/structure')) {
                if (activeTab !== 'PAYROLL') setActiveTab('PAYROLL');
            } else if (path.includes('/attendance')) {
                if (activeTab !== 'ATTENDANCE_SUMMARY') setActiveTab('ATTENDANCE_SUMMARY');
            } else {
                if (activeTab !== 'PAYROLL') setActiveTab('PAYROLL');
            }
        } else if (path.startsWith('/people/employees')) {
            if (path.includes('/allowances')) {
                if (activeTab !== 'ALLOWANCE_MANAGER') setActiveTab('ALLOWANCE_MANAGER');
            } else {
                if (activeTab !== 'STAFF_MANAGER') setActiveTab('STAFF_MANAGER');
            }
        } else if (path.startsWith('/people/attendance')) {
            if (activeTab !== 'ATTENDANCE_BOARD') setActiveTab('ATTENDANCE_BOARD');
        } else if (path.startsWith('/finance/sms-tracker')) {
            if (activeTab !== 'SMS_TRACKER') setActiveTab('SMS_TRACKER');
        } else if (path.startsWith('/finance/budget-tracker')) {
            if (activeTab !== 'BUDGET_TRACKER') setActiveTab('BUDGET_TRACKER');
        }
    }, [location.pathname, location.search, activeTab, setActiveTab]);
};
