import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, reset } from '../redux/slices/authSlice';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from './common/ThemeToggle';
import { AppDispatch, RootState } from '../redux/store';

interface SubMenuItem {
    name: string;
    path: string;
}

interface MenuItem {
    name: string;
    path?: string;
    icon: React.ReactNode;
    submenu?: SubMenuItem[];
}

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    isCollapsed?: boolean;
    setIsCollapsed?: (collapsed: boolean) => void;
    expandedMenus?: Record<string, boolean>;
    setExpandedMenus?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const Sidebar: React.FC<SidebarProps> = ({
    isOpen = false,
    onClose = () => { },
    isCollapsed = false,
    setIsCollapsed = () => { },
    expandedMenus = {},
    setExpandedMenus = () => { }
}) => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        navigate('/login');
        onClose();
    };

    // Ref to preserve scroll position
    const navRef = useRef<HTMLElement>(null);
    const scrollPositionRef = useRef(0);

    // State for hover expansion (temporary)
    const [isHoverExpanded, setIsHoverExpanded] = useState(false);

    // Determine effective expanded state
    const isEffectivelyExpanded = !isCollapsed || isHoverExpanded;

    // Restore scroll position from localStorage on mount
    useEffect(() => {
        if (navRef.current) {
            const savedScrollPosition = localStorage.getItem('sidebarScrollPosition');
            if (savedScrollPosition) {
                navRef.current.scrollTop = parseInt(savedScrollPosition, 10);
                scrollPositionRef.current = parseInt(savedScrollPosition, 10);
            }
        }
    }, []);

    // Preserve scroll position when state changes
    useEffect(() => {
        if (navRef.current && scrollPositionRef.current >= 0) {
            requestAnimationFrame(() => {
                if (navRef.current) {
                    navRef.current.scrollTop = scrollPositionRef.current;
                    localStorage.setItem('sidebarScrollPosition', scrollPositionRef.current.toString());
                }
            });
        }
    }, [expandedMenus]);

    // Hover handlers - only work when manually collapsed
    const handleMouseEnter = () => {
        if (isCollapsed) {
            setIsHoverExpanded(true);
        }
    };

    const handleMouseLeave = () => {
        if (isCollapsed) {
            setIsHoverExpanded(false);
        }
    };

    // Toggle submenu expansion with scroll preservation
    const toggleSubmenu = (menuName: string) => {
        if (navRef.current) {
            scrollPositionRef.current = navRef.current.scrollTop;
        }
        setExpandedMenus(prev => {
            const isCurrentlyExpanded = prev[menuName];
            if (isCurrentlyExpanded) {
                return { ...prev, [menuName]: false };
            }
            return { [menuName]: true };
        });
    };

    const menuItems: MenuItem[] = [
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            name: 'Sales',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            submenu: [
                { name: 'Sales Invoice', path: '/sales/invoice' },
                { name: 'Estimate / Proforma', path: '/sales/estimate' },
                { name: 'Payment In', path: '/sales/payment-in' },
                { name: 'Payment In List', path: '/sales/payment-in-list' },
                { name: 'Sales Order', path: '/sales/order' },
                { name: 'Sales Order List', path: '/sales/sales-order-list' },
                { name: 'Delivery Challan', path: '/sales/delivery-challan' },
                { name: 'Delivery Challan List', path: '/sales/delivery-challan-list' },
                { name: 'Return', path: '/sales/return' },
                { name: 'Returned Items', path: '/sales/returned-items' }
            ]
        },
        {
            name: 'Purchase',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            submenu: [
                { name: 'Purchase Entry', path: '/purchase/entry' },
                { name: 'Purchase Orders', path: '/purchase/order' },
                { name: 'Goods Received', path: '/purchase/received' },
                { name: 'Bills / Invoices', path: '/purchase/bills' },
                { name: 'Outstanding Payables', path: '/purchase/payables' },
                { name: 'Payments Made', path: '/purchase/payment-out' },
                { name: 'Debit Notes / Returns', path: '/purchase/return' },
                { name: 'Expenses', path: '/purchase/expenses' },
            ]
        },
        {
            name: 'Customers',
            path: '/customers',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
        },
        {
            name: 'Suppliers',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            submenu: [
                { name: 'Supplier Directory', path: '/suppliers' },
                { name: 'Add New Supplier', path: '/suppliers/add' },
                { name: 'Supplier Groups', path: '/suppliers/groups' },
                { name: 'Supplier Ledger', path: '/suppliers/ledger' },
                { name: 'Supplier Statements', path: '/suppliers/statements' }
            ]
        },
        {
            name: 'Inventory',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            submenu: [
                { name: 'Stock Authority', path: '/inventory' },
                { name: 'Aged Stock Pulse', path: '/inventory/aged-stock' },
                { name: 'Add New Item', path: '/inventory/add' },
                { name: 'Batch Price Update', path: '/inventory/batch-price-update' },
                { name: 'Reprint Queue', path: '/inventory/reprint-queue' },
            ]
        },
        {
            name: 'Cash & Bank',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
            submenu: [
                { name: 'Finance Overview', path: '/cashbank/overview' },
                { name: 'Bank Accounts', path: '/cashbank/bank-accounts' },
                { name: 'Bank Summary', path: '/cashbank/bank-summary' },
                { name: 'Cash/Bank Position', path: '/cashbank/position' },
                { name: 'Transfers', path: '/cashbank/transfers' },
                { name: 'Cash in Hand', path: '/cashbank/cash-in-hand' },
                { name: 'Cheques', path: '/cashbank/cheques' },
                { name: 'Loan Accounts', path: '/cashbank/loan-accounts' },
                { name: 'Bank Intelligence', path: '/cashbank/bank-intelligence' },
                { name: 'Reconciliation', path: '/cashbank/reconciliation' },
                { name: 'Petty Cash', path: '/cashbank/petty-cash' },
                { name: 'Day End Recon', path: '/cashbank/day-end-reconciliation' }
            ]
        },
        {
            name: 'POS',
            path: '/pos',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            name: 'Reports',
            path: '/reports',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            submenu: [
                { name: 'Reports Home', path: '/reports' },
                { name: 'Business Snapshot', path: '/reports/business-snapshot' },
                { name: 'ProfitPulse AI', path: '/reports/profit-pulse' }
            ]
        },
        {
            name: 'Employees',
            path: '/employees',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
        },
        {
            name: 'Grow Business',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            submenu: [
                { name: 'Online Shop', path: '/business/online-shop' },
                { name: 'Google Profile', path: '/business/google-profile' },
                { name: 'Marketing Tools', path: '/business/marketing-tools' },
                { name: 'WhatsApp Marketing', path: '/business/whatsapp-marketing' }
            ]
        },
        {
            name: 'Sync & Backup',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
            ),
            submenu: [
                { name: 'Sync & Share', path: '/sync/share' },
                { name: 'Backup', path: '/sync/backup' },
                { name: 'Restore', path: '/sync/restore' }
            ]
        },
        {
            name: 'Expenses',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            submenu: [
                { name: 'Daily Finance', path: '/expenses/daily' },
                { name: 'Expense Manager', path: '/expenses/manager' },
                { name: 'Expense Home', path: '/expenses' },
                { name: 'Categories Manager', path: '/expenses/categories' },
                { name: 'Expense Intelligence', path: '/expenses/intelligence' },
                { name: 'Expense Reports', path: '/expenses/reports' },
                { name: 'Recurring Expenses', path: '/expenses/recurring' }
            ]
        },
        {
            name: 'Utilities',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            submenu: [
                { name: 'Barcode Generator', path: '/utilities/barcode' },
                { name: 'Import Items', path: '/utilities/import-items' },
                { name: 'Business Setup', path: '/utilities/business-setup' },
                { name: 'Data Export', path: '/utilities/export' }
            ]
        },
        {
            name: 'Settings',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            submenu: [
                { name: 'General', path: '/settings/general' },
                { name: 'Branches', path: '/settings/branches' },
                { name: 'Branding', path: '/settings/branding' },
                { name: 'Finance', path: '/settings/finance' },
                { name: 'Modules', path: '/settings/modules' },
                { name: 'MIS Controls', path: '/settings/mis' },
                { name: 'Integrations', path: '/settings/integrations' },
                { name: 'Security', path: '/settings/security' },
                { name: 'Personalization', path: '/settings/personalization' },
                { name: 'Subscription', path: '/settings/subscription' }
            ]
        }
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden print:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <aside
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`print:hidden fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-xl border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 lg:shadow-none ${isEffectivelyExpanded ? 'w-64' : 'w-20'
                    }`}
            >
                {/* Logo/Brand */}
                <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 relative overflow-hidden">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"></div>

                    {isEffectivelyExpanded ? (
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-3.5">
                                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl shadow-lg shadow-emerald-500/30 ring-1 ring-white/10">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl font-black text-white tracking-tight leading-none font-sans">
                                        {user?.shopName || 'Oripio'} <span className="text-emerald-500">ERP</span>
                                    </h1>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Enterprise</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="lg:hidden text-slate-400 hover:text-white transition-colors p-1"
                                aria-label="Close navigation"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-center w-full group">
                            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Toggle Button */}
                <div className="hidden lg:flex justify-end p-4 shrink-0">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all border border-slate-700 hover:border-emerald-500/50"
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav
                    ref={navRef as any}
                    onScroll={(e) => {
                        const scrollTop = e.currentTarget.scrollTop;
                        scrollPositionRef.current = scrollTop;
                        localStorage.setItem('sidebarScrollPosition', scrollTop.toString());
                    }}
                    className="flex-1 px-4 py-2 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar"
                >
                    {menuItems.map((item) => (
                        <div key={item.name} className="relative group">
                            {item.submenu ? (
                                <div>
                                    <button
                                        onClick={() => toggleSubmenu(item.name)}
                                        className={`flex items-center w-full rounded-2xl transition-all duration-300 group ${isEffectivelyExpanded
                                            ? 'justify-between px-4 py-3 hover:bg-slate-800'
                                            : 'justify-center px-2 py-3 hover:bg-slate-800'
                                            } ${expandedMenus[item.name] ? 'bg-slate-800/80' : ''}`}
                                        title={!isEffectivelyExpanded ? item.name : ''}
                                    >
                                        <div className={`flex items-center ${isEffectivelyExpanded ? 'gap-4' : 'justify-center'}`}>
                                            <div className={`transition-all duration-300 ${expandedMenus[item.name] ? 'text-emerald-400 scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-slate-400 group-hover:text-emerald-400'}`}>
                                                {item.icon}
                                            </div>
                                            {isEffectivelyExpanded && <span className={`text-sm font-bold tracking-wide transition-colors ${expandedMenus[item.name] ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{item.name}</span>}
                                        </div>
                                        {isEffectivelyExpanded && (
                                            <svg
                                                className={`w-4 h-4 transition-transform duration-300 text-slate-600 ${expandedMenus[item.name] ? 'rotate-180 text-emerald-400' : 'group-hover:text-slate-400'}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* Submenu Dropdown */}
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedMenus[item.name] && isEffectivelyExpanded ? 'max-h-[800px] opacity-100 mt-2 mb-2' : 'max-h-0 opacity-0'}`}>
                                        <div className="bg-slate-900/50 rounded-2xl p-1 space-y-0.5 mx-2 border border-slate-800/50">
                                            {item.submenu.map((subItem) => (
                                                <NavLink
                                                    key={subItem.path}
                                                    to={subItem.path}
                                                    className={({ isActive }) =>
                                                        `block px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                                            ? 'bg-emerald-500/10 text-emerald-400 shadow-sm'
                                                            : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
                                                        }`
                                                    }
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${location.pathname === subItem.path ? 'bg-emerald-400' : 'bg-slate-700'}`}></div>
                                                        {subItem.name}
                                                    </div>
                                                </NavLink>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <NavLink
                                    to={item.path || '#'}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center rounded-2xl transition-all duration-300 ease-out group ${isEffectivelyExpanded ? 'gap-4 px-4 py-3' : 'justify-center px-2 py-3'
                                        } ${isActive
                                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                            : 'text-slate-400 hover:bg-slate-800'
                                        }`
                                    }
                                    title={!isEffectivelyExpanded ? item.name : ''}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className={`${isActive ? 'text-white scale-110' : 'group-hover:text-emerald-400 group-hover:scale-110'} transition-transform duration-300`}>
                                                {item.icon}
                                            </div>

                                            {isEffectivelyExpanded && <span className={`text-sm font-bold tracking-wide ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`}>{item.name}</span>}
                                        </>
                                    )}
                                </NavLink>
                            )}
                        </div>
                    ))}

                    {/* System Upgrade CTA - Only show when expanded */}
                    {isEffectivelyExpanded && (
                        <div className="mt-6 mx-2 p-5 rounded-2xl bg-gradient-to-br from-emerald-900/50 to-slate-900 border border-emerald-500/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-all"></div>
                            <h4 className="text-white font-bold text-sm relative z-10">Upgrade System</h4>
                            <p className="text-emerald-200/60 text-xs mt-1 relative z-10 mb-3">Unlock advanced AI features.</p>
                            <button className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-emerald-900/20 relative z-10">
                                Upgrade Now
                            </button>
                        </div>
                    )}
                </nav>

                {/* User Profile & Theme Toggle */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                    <div className="mb-4 flex justify-center">
                        <ThemeToggle />
                    </div>
                    {isEffectivelyExpanded ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-slate-300 dark:border-slate-600 shadow-sm">
                                <span className="font-bold text-slate-700 dark:text-white text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.name}</p>
                                <button onClick={onLogout} className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors mt-0.5">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center flex-col gap-3 items-center">
                            <button onClick={onLogout} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 text-slate-400 flex items-center justify-center transition-all border border-slate-200 dark:border-slate-700" title="Sign Out">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                        </div>
                    )}
                </div>
            </aside >
            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
          border: 2px solid #1e293b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
        </>
    );
};

export default Sidebar;
