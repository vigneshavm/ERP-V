import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout, reset } from '../redux/slices/authSlice';
import { useTheme } from '../contexts/ThemeContext';
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
                { name: 'Purchase', path: '/purchase/entry' },
                { name: 'Bills', path: '/purchase/bills' },
                { name: 'Payment Out', path: '/purchase/payment-out' },
                { name: 'Expenses', path: '/purchase/expenses' },
                { name: 'Purchase Order', path: '/purchase/order' },
                { name: 'Purchase Return', path: '/purchase/return' }
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
            path: '/inventory',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
        },
        {
            name: 'Cash & Bank',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
            submenu: [
                { name: 'Bank Accounts', path: '/cashbank/bank-accounts' },
                { name: 'Bank Summary', path: '/cashbank/bank-summary' },
                { name: 'Cash/Bank Position', path: '/cashbank/position' },
                { name: 'Transfers', path: '/cashbank/transfers' },
                { name: 'Cash in Hand', path: '/cashbank/cash-in-hand' },
                { name: 'Cheques', path: '/cashbank/cheques' },
                { name: 'Loan Accounts', path: '/cashbank/loan-accounts' }
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
                { name: 'Daily Expenses', path: '/expenses' },
                { name: 'Expense Tracker', path: '/expenses/tracker' },
                { name: 'Expense Dashboard', path: '/expenses/dashboard' },
                { name: 'Expense List', path: '/expenses/list' },
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
            path: '/settings',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
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
                className={`print:hidden fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-300 shadow-xl border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0 lg:shadow-none ${isEffectivelyExpanded ? 'w-64' : 'w-20'
                    }`}
            >
                {/* Logo/Brand */}
                <div className="h-16 flex items-center px-4 border-b border-slate-800 bg-slate-900 shrink-0">
                    {isEffectivelyExpanded ? (
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-white tracking-tight leading-none">{user?.shopName || 'BizzAI'}</h1>
                                    {/* <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Enterprise</p> */}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="lg:hidden text-slate-400 hover:text-white transition-colors"
                                aria-label="Close navigation"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-center w-full">
                            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Toggle Button */}
                <div className="hidden lg:flex justify-end p-2 shrink-0">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors border border-slate-700"
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        <svg className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
                >
                    {menuItems.map((item) => (
                        <div key={item.name} className="relative group">
                            {item.submenu ? (
                                <div>
                                    <button
                                        onClick={() => toggleSubmenu(item.name)}
                                        className={`flex items-center w-full rounded-md transition-all duration-200 ${isEffectivelyExpanded
                                            ? 'justify-between px-3 py-2.5 hover:bg-slate-800 hover:text-white'
                                            : 'justify-center px-2 py-2.5 hover:bg-slate-800 hover:text-white'
                                            } ${expandedMenus[item.name] ? 'text-white bg-slate-800/50' : 'text-slate-400'}`}
                                        title={!isEffectivelyExpanded ? item.name : ''}
                                    >
                                        <div className={`flex items-center ${isEffectivelyExpanded ? 'gap-3' : 'justify-center'}`}>
                                            <div className={`transition-colors duration-200 ${expandedMenus[item.name] ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`}>
                                                {item.icon}
                                            </div>
                                            {isEffectivelyExpanded && <span className="text-sm font-medium">{item.name}</span>}
                                        </div>
                                        {isEffectivelyExpanded && (
                                            <svg
                                                className={`w-4 h-4 transition-transform duration-200 text-slate-500 ${expandedMenus[item.name] ? 'rotate-180 text-slate-300' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* Submenu Dropdown */}
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedMenus[item.name] && isEffectivelyExpanded ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                        <div className="bg-slate-900 pl-4 pr-1 space-y-1">
                                            {item.submenu.map((subItem) => (
                                                <NavLink
                                                    key={subItem.path}
                                                    to={subItem.path}
                                                    className={({ isActive }) =>
                                                        `block px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border-l-2 pl-3 ${isActive
                                                            ? 'border-indigo-500 text-white bg-slate-800/50'
                                                            : 'border-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-800/30'
                                                        }`
                                                    }
                                                >
                                                    {subItem.name}
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
                                        `flex items-center rounded-md transition-all duration-200 ${isEffectivelyExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center px-2 py-2.5'
                                        } ${isActive
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`
                                    }
                                    title={!isEffectivelyExpanded ? item.name : ''}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className={isActive ? 'text-white' : 'group-hover:text-indigo-400 transition-colors'}>
                                                {item.icon}
                                            </div>

                                            {isEffectivelyExpanded && <span className="text-sm font-medium">{item.name}</span>}
                                        </>
                                    )}
                                </NavLink>
                            )}
                        </div>
                    ))}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
                    {isEffectivelyExpanded ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 shadow-sm">
                                <span className="font-bold text-white text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                                <button onClick={onLogout} className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors mt-0.5">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <button onClick={onLogout} className="w-10 h-10 rounded-full bg-slate-800 hover:bg-red-900/30 hover:text-red-500 text-slate-400 flex items-center justify-center transition-all border border-slate-700" title="Sign Out">
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
