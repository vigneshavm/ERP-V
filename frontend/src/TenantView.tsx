import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingCart, Archive, Settings, Menu, X,
    Ban, Shield, Store, LogOut, ArrowRight, DollarSign, List, ShoppingBag,
    Lock, Zap, LucideIcon, Clock, ChevronLeft, ChevronRight, FileText,
    Key, ArrowLeft, Plus, Landmark, Rocket, Share2, RotateCcw, Barcode,
    FileUp, FileDown
} from 'lucide-react';

import { RootState } from './redux/store';
import { setBranch, setUser } from './redux/slices/authSlice';
import { setActiveTab, setSidebarOpen, setDesktopCollapsed } from './redux/slices/uiSlice';
import { APP_CONFIG } from './config';

// --- CONFIG & CONTEXTS ---
import { ConfigProvider } from './contexts/ConfigProvider';
import { useConfig } from './contexts/ConfigContext';
import { useBranchResolver } from './hooks/useBranchResolver';
import { getSession, clearSession } from './utils/session';
import { MENU_ITEMS, MenuItem } from './config/menu.config';

// Helper to flatten menu items for easy lookup
const FLATTENED_MENU_ITEMS: MenuItem[] = [];
const flattenItems = (items: MenuItem[]) => {
    items.forEach(item => {
        FLATTENED_MENU_ITEMS.push(item);
        if (item.children) {
            flattenItems(item.children);
        }
    });
};
flattenItems(MENU_ITEMS);

// --- TYPES ---
import { AppView } from './types/common';
import { Tenant, DbRoleCode } from './types/tenant';

// --- COMPONENTS & PAGES ---
import Sidebar from './components/shared/Layout/Sidebar';
import PlaceholderPage from './components/shared/UI/PlaceholderPage';
import ChangePasswordModal from './components/shared/Auth/ChangePasswordModal';
import Login from './pages/Auth/Login';

// --- DASHBOARD ---
import BusinessSnapshot from './pages/Dashboard/BusinessSnapshot';
import Dashboard from './pages/Dashboard/Dashboard';
import GrowDashboard from './pages/Dashboard/GrowDashboard';
import GrowthHub from './pages/Dashboard/GrowthHub';
import MarketingMetrics from './pages/Dashboard/MarketingMetrics';
import OnlinePerformance from './pages/Dashboard/OnlinePerformance';
import ProfitPulse from './pages/Dashboard/ProfitPulse';
import RevenueChart from './pages/Dashboard/RevenueChart';

//-- Expenses -- 
import DailyFinanceTracker from './pages/Financial/Expenses/DailyFinance';

// --- COMMERCIAL: SALES ---
import SalesModulePlaceholder from './components/sales/SalesModulePlaceholder';
import SalesInvoice from './pages/Commercial/Sales/salesInvoices/SalesInvoice';
import EstimatesList from './pages/Commercial/Sales/estimates/EstimateList';
import SalesOrderList from './pages/Commercial/Sales/salesOrders/SalesOrderList';
import DeliveryChallanList from './pages/Commercial/Sales/deliveryChallans/DeliveryChallanList';
import SalesReturnList from './pages/Commercial/Sales/returns/ReturnedItems'; // Or Return.tsx? Using ReturnedItems for List.
import PaymentInList from './pages/Commercial/Sales/payments/PaymentInList';
import CustomersWithDues from './pages/People/Customers/CustomersWithDues'; // CUSTOMER_CREDITS

// --- COMMERCIAL: PURCHASE ---
import PurchaseManager from './pages/Commercial/Purchase/PurchaseOrdersModule'; // Overview/Dashboard
import PurchaseRegister from './pages/Commercial/Purchase/PurchaseRegister';
import PurchaseEntry from './pages/Commercial/Purchase/PurchaseEntry';

import GoodsReceived from './pages/Commercial/Purchase/GoodsReceived';
import DebitNotes from './pages/Commercial/Purchase/DebitNotes';
import SupplierPayments from './pages/Commercial/Purchase/SupplierPayments';
import OutstandingPayables from './pages/Commercial/Purchase/OutstandingPayables';

// --- COMMERCIAL: INVENTORY ---
import InventoryManager from './pages/Commercial/Inventory/InventoryManager';
import CategoryManager from './pages/Commercial/Inventory/CategoryManager';
import AgedStockManager from './pages/Commercial/Inventory/AgedStockManager'; // BATCH_EXPIRY

// --- PEOPLE ---
import CustomerList from './pages/People/Customers/CustomerList';
import CustomerLedger from './pages/People/Customers/CustomerLedger';
import VendorManager from './pages/People/Suppliers/Suppliers'; // Supplier List
import SupplierLedger from './pages/People/Suppliers/SupplierLedger';
import SupplierStatements from './pages/People/Suppliers/SupplierStatements';
import StaffManager from './pages/People/Employees/StaffManager';
import LaborManager from './pages/People/Employees/LaborManager';
import TenantManager from './pages/People/Tenants/TenantManager';
import VendorForm from './pages/People/Suppliers/AddSupplier';
import EditSupplier from './pages/People/Suppliers/EditSupplier';
import VendorDetails from './pages/People/Suppliers/SupplierDetail';

// --- FINANCIAL: CASH & BANK ---
import FinanceTracker from './pages/Financial/Expenses/Expenses'; // Overview
import CashInHand from './pages/Financial/Cashbank/CashInHand';
import BankAccounts from './pages/Financial/Cashbank/BankAccounts';
import PettyCash from './pages/Financial/Cashbank/PettyCash';
import FundTransfer from './pages/Financial/Cashbank/FundTransfer';
import BankReconciliation from './pages/Financial/Cashbank/BankReconciliation';
import BankSummary from './pages/Financial/Cashbank/BankSummary';
import TransactionList from './pages/Financial/Cashbank/Transfers';
import DueAdjustment from './pages/Financial/DueAdjustment';

// --- POS ---
import POSModule from './pages/Commercial/Pos/POSModule';

// --- ONLINE STORE ---
import Storefront from './pages/OnlineStore/Storefront';

// --- SYSTEM ---
import SettingsManager from './pages/System/Settings/Settings';
import SyncAndShare from './pages/System/Sync/SyncShare';
import RestoreManagement from './pages/System/Sync/Restore';
import BulkImport from './pages/System/Data/components/BulkImport';
import DataExport from './pages/System/Data/components/DataExport';
import BarcodeGenerator from './pages/System/Data/components/BarcodeGenerator';
import TenantArchitect from './pages/System/Architecture/TenantArchitect';
import SuperAdminGrowthConsole from './pages/System/Architecture/SuperAdminGrowthConsole';

// --- ANALYTICS / GROW ---
import ReportsModule from './pages/Analytics/Reports';
import GrowBusiness from './pages/Dashboard/GrowDashboard';
import GoogleBusinessPage from './pages/GoogleBusiness';
import Marketing from './pages/Marketing';

// --- CUSTOMER ENGAGEMENT ---
import CustomerEngagement from './pages/CustomerEngagement';
import EmailEngagement from './pages/CustomerEngagement/EmailEngagement';
import FeedbackEngagement from './pages/CustomerEngagement/FeedbackEngagement';
import LoyaltyEngagement from './pages/CustomerEngagement/LoyaltyEngagement';
import WhatsAppEngagement from './pages/CustomerEngagement/WhatsAppEngagement';

import POSReturnsIntelligence from './pages/Commercial/Pos/POSReturnsIntelligence';

// Placeholder components if missing
const POSOrdersIntelligence = () => <PlaceholderPage title="POS Orders Intelligence" />;
const ShiftManagementIntelligence = () => <PlaceholderPage title="Shift Management" />;

interface TenantViewProps {
    currentTenant: Tenant | null;
    isLoggedIn: boolean;
    onLogout: () => void;
}

const TenantView: React.FC<TenantViewProps> = ({ currentTenant, isLoggedIn, onLogout }) => {
    const dispatch = useDispatch();

    // Selectors
    const { user, role } = useSelector((state: RootState) => state.auth);
    const { activeTab, sidebarOpen, desktopCollapsed } = useSelector((state: RootState) => state.ui);
    const { tenants } = useSelector((state: RootState) => state.tenant);
    const { rolePermissions } = useSelector((state: RootState) => state.settings);

    // Local State
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    // Hooks
    const { getBranchName } = useBranchResolver();
    const location = useLocation();

    // --- URL Sync Logic ---
    React.useEffect(() => {
        const currentPath = location.pathname;

        // Find matching item by path
        // We match exact path or simple prefix if needed
        // Reverse sort by path length to match specific paths before generic ones
        const match = FLATTENED_MENU_ITEMS
            .filter(item => item.path)
            .sort((a, b) => (b.path?.length || 0) - (a.path?.length || 0))
            .find(item => {
                if (!item.path) return false;
                // Exact match
                if (item.path === currentPath) return true;
                // Match sub-routes (e.g. /suppliers/add should match /suppliers or specific)
                // But careful with / and /pos
                if (currentPath.startsWith(item.path) && item.path !== '/') return true;
                return false;
            });

        if (match && match.id !== activeTab) {
            // Only update if effective tab logic warrants it.
            // If we are at /suppliers/add, match might be 'SUPPLIER_LIST' (path: /suppliers) or similar
            // We want to set the tab that controls the view.
            dispatch(setActiveTab(match.id));
        }
    }, [location.pathname, dispatch, activeTab]);

    // Derive effective tenant from user session or prop
    const effectiveTenant = React.useMemo(() => {
        if (user?.tenantId) {
            return tenants.find(t => t.id === user.tenantId) || currentTenant;
        }
        return currentTenant;
    }, [user?.tenantId, tenants, currentTenant]);

    const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
        setConfirmDialog({ isOpen: true, title, message, onConfirm });
    };

    const handleConfirm = () => {
        confirmDialog.onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    };

    const handleLogout = () => {
        requestConfirm('Lock Terminal', 'Lock terminal and return to PIN screen?', () => {
            // Call parent logout
            if (onLogout) {
                onLogout();
            } else {
                clearSession();
                localStorage.removeItem('erp_current_tenant');
                window.location.reload();
            }
        });
    };

    // --- Permission Helper ---
    const checkAccess = (view: AppView): boolean => {
        if (!user) return false;

        // Manual Bypass for specific user
        if (user.email === 'avmvignesh0207@gmail.com') return true;

        // Safely get role code
        const effectiveRoleCode = (user.systemRole || 'STAFF').toUpperCase();
        const allowedViews = rolePermissions[effectiveRoleCode as DbRoleCode] || [];
        // Add rudimentary check if rolePermissions is empty or fail gracefully
        if (!rolePermissions[effectiveRoleCode as DbRoleCode]) {
            // Fallback or log? For now proceed if no permissions defined (or return false strict)
            // strict: return false; 
        }
        return allowedViews.includes(view);
    };

    // 1. Check Login
    if (!isLoggedIn) {
        return (
            <ConfigProvider tenant={effectiveTenant}>
                <Login />
            </ConfigProvider>
        );
    }

    // 2. Render Content (with Permission Check)
    const renderContent = () => {
        // Strict permission check
        if (!checkAccess(activeTab)) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 animate-in fade-in">
                    <Ban className="w-16 h-16 mb-4 text-red-400 opacity-80" />
                    <h2 className="text-2xl font-bold text-slate-600 dark:text-slate-300">Access Denied</h2>
                    <p className="mt-2 text-sm">You do not have permission to view the {activeTab} module.</p>
                    <p className="text-xs mt-1">Role: {role}</p>
                </div>
            );
        }

        switch (activeTab) {
            // --- DASHBOARD ---
            case 'DASHBOARD': return <Dashboard />;
            case 'PROFIT_PULSE': return <ProfitPulse />;
            case 'DASHBOARD_SNAPSHOT': return <BusinessSnapshot />;
            case 'DASHBOARD_SUMMARY': return <DailyFinanceTracker />;

            // --- SALES ---
            case 'SALES': return <SalesModulePlaceholder view="Overview" />;
            case 'SALES_REGISTER': return <SalesInvoice />; // Use List as "Register"
            case 'SALES_INVOICE': return <SalesInvoice />; // Or create mode?
            case 'ESTIMATE': return <EstimatesList />;
            case 'SALES_ORDER': return <SalesOrderList />;
            case 'DELIVERY_CHALLAN': return <DeliveryChallanList />;
            case 'SALES_RETURN': return <SalesReturnList />;
            case 'PAYMENT_IN': return <PaymentInList />;
            case 'CUSTOMER_CREDITS': return <CustomersWithDues />;
            case 'OUTSTANDING_DUES': return <DueAdjustment />;

            // --- PURCHASE ---
            case 'PURCHASE': return <PurchaseManager />;
            case 'PURCHASE_REGISTER': return <PurchaseRegister />;
            case 'PURCHASE_ENTRY': return <PurchaseEntry />;
            case 'PURCHASE_ORDER': return <PurchaseManager />;
            case 'GOODS_RECEIVED': return <GoodsReceived />;
            case 'DEBIT_NOTES': return <DebitNotes />;
            case 'SUPPLIER_PAYMENTS': return <SupplierPayments />;
            case 'OUTSTANDING_PAYABLES': return <OutstandingPayables />;

            // --- INVENTORY ---
            case 'INVENTORY': return <InventoryManager />;
            case 'INVENTORY_ITEMS': return <InventoryManager />;
            case 'ITEM_CATEGORIES': return <CategoryManager />;
            case 'BATCH_EXPIRY': return <AgedStockManager />;
            case 'BARCODE_GENERATOR': return <BarcodeGenerator />;
            case 'AGED_STOCK': return <AgedStockManager />;

            // --- FINANCE ---
            case 'FINANCE': return <FinanceTracker />;
            case 'DAILY': return <DailyFinanceTracker />;
            case 'CASH_ACCOUNTS': return <CashInHand />;
            case 'BANK_ACCOUNTS': return <BankAccounts />;
            case 'PETTY_CASH': return <PettyCash />;
            case 'FUND_TRANSFERS': return <FundTransfer />;
            case 'BANK_RECONCILIATION': return <BankReconciliation />;
            case 'BANK_SUMMARY': return <BankSummary />;
            case 'TRANSACTIONS': return <TransactionList />;

            // --- EXPENSES ---
            case 'EXPENSES': return <FinanceTracker />;
            case 'EXPENSE_CATEGORIES': return <PlaceholderPage title="Expense Categories" />;
            case 'RECURRING_EXPENSES': return <PlaceholderPage title="Recurring Expenses" />;
            case 'EXPENSE_REPORTS': return <PlaceholderPage title="Expense Reports" />;

            // --- POS ---
            case 'POS': return <POSModule />;
            case 'POS_ORDERS': return <POSOrdersIntelligence />;
            case 'POS_RETURNS': return <POSReturnsIntelligence />;
            case 'SHIFT_MANAGEMENT': return <ShiftManagementIntelligence />;

            // --- PEOPLE: CUSTOMERS ---
            case 'CUSTOMERS': return <CustomerList />;
            case 'CUSTOMER_LIST': return <CustomerList />;
            case 'CUSTOMER_LEDGER': return <CustomerLedger />;
            // case 'CUSTOMER_STATEMENTS': return <PlaceholderPage title="Customer Statements" />;

            // --- PEOPLE: SUPPLIERS ---
            case 'VENDORS': return <VendorManager />;
            case 'SUPPLIERS': return <VendorManager />;
            case 'SUPPLIER_LIST': return <VendorManager />;
            case 'SUPPLIER_LEDGER': return <SupplierLedger />;
            case 'SUPPLIER_STATEMENTS': return <SupplierStatements />;
            case 'SUPPLIER_GROUPS': return <PlaceholderPage title="Supplier Groups" />;

            // --- PEOPLE: STAFF ---
            case 'LABOR': return <LaborManager />;

            case 'STAFF_MANAGER': return <StaffManager />;
            case 'PAYROLL': return <PlaceholderPage title="Payroll" />;
            case 'ATTENDANCE': return <PlaceholderPage title="Attendance" />;

            // --- ONLINE STORE ---
            case 'STOREFRONT': return <Storefront />;

            // --- SYSTEM ---
            case 'SETTINGS': return <SettingsManager />;
            case 'BUSINESS_PROFILE': return <SettingsManager />; // Route to profile tab?
            case 'THEMES_BRANDING': return <SettingsManager />;
            case 'BRANCH_SETTINGS': return <SettingsManager />;
            case 'FINANCIAL_YEAR': return <SettingsManager />;
            case 'USERS_ROLES': return <SettingsManager />;
            case 'INTEGRATIONS': return <SettingsManager />;

            case 'SYNC_SHARE': return <SyncAndShare />;
            case 'GROW_SYNC': return <SyncAndShare />; // Mapped ID
            case 'GROW_SYNC_DEVICE': return <SyncAndShare />;
            case 'RESTORE': return <RestoreManagement />;
            case 'GROW_RESTORE_DATA': return <RestoreManagement />;
            case 'BULK_IMPORT': return <BulkImport />;
            case 'DATA_EXPORT': return <DataExport />;
            case 'GROW_DATA_EXPORT': return <DataExport />;
            case 'TENANT_MANAGEMENT': return <TenantManager />;
            case 'TENANT_ARCHITECT': return <TenantArchitect />;
            case 'SUPER_ADMIN_CONSOLE': return <SuperAdminGrowthConsole />;

            // --- GROW ---
            case 'GROW': return <GrowthHub />;
            case 'GROW_HUB': return <GrowthHub />;
            case 'GROW_DASHBOARD': return <GrowDashboard />;
            case 'GROW_OVERVIEW': return <GrowDashboard />;
            case 'GROW_PERFORMANCE': return <OnlinePerformance />;
            case 'GROW_REVENUE': return <RevenueChart data={[]} theme="light" />;

            case 'GROW_MARKETING':
            case 'GROW_MARKETING_CAMPAIGNS':
            case 'GROW_MARKETING_TEMPLATES':
            case 'GROW_MARKETING_EMAIL':
            case 'GROW_MARKETING_WHATSAPP':
            case 'GROW_MARKETING_SOCIAL':
            case 'GROW_MARKETING_COUPONS':
            case 'GROW_MARKETING_OFFERS':
                return <Marketing />;

            case 'GROW_ENGAGEMENT': return <CustomerEngagement />;
            case 'GROW_ENGAGEMENT_SMS': return <CustomerEngagement />;
            case 'GROW_ENGAGEMENT_WHATSAPP': return <WhatsAppEngagement />;
            case 'GROW_ENGAGEMENT_EMAIL': return <EmailEngagement />;
            case 'GROW_ENGAGEMENT_LOYALTY': return <LoyaltyEngagement />;
            case 'GROW_ENGAGEMENT_FEEDBACK': return <FeedbackEngagement />;

            case 'GROW_GOOGLE': return <GoogleBusinessPage />;
            case 'GROW_GOOGLE_PROFILE': return <GoogleBusinessPage />;

            // --- LEGACY / OTHER ---
            case 'VENDOR_FORM': return <VendorForm />;
            case 'VENDOR_DETAILS': return <VendorDetails />;
            case 'REPORTS': return <ReportsModule />;
            case 'REPORT_SALES': return <ReportsModule />; // Pass props to filter?

            default: return <Dashboard />;
        }
    };

    // Ensure we scroll to top on tab change
    React.useEffect(() => {
        const viewport = document.querySelector('main > div');
        if (viewport) viewport.scrollTop = 0;
    }, [activeTab]);

    return (
        <ConfigProvider tenant={effectiveTenant}>
            <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900 dark:text-slate-100">
                {/* Mobile Bottom Navigation (Native App Shell) */}
                <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 flex justify-around items-center h-16 pb-safe">
                    <button
                        onClick={() => dispatch(setActiveTab('DASHBOARD'))}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'DASHBOARD' ? 'text-indigo-600' : 'text-slate-400'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Home</span>
                    </button>
                    <button
                        onClick={() => dispatch(setActiveTab('POS'))}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'POS' ? 'text-indigo-600' : 'text-slate-400'}`}
                    >
                        <ShoppingCart className="w-5 h-5" />
                        <span className="text-[10px] font-medium">POS</span>
                    </button>
                    <button
                        onClick={() => dispatch(setActiveTab('INVENTORY'))}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'INVENTORY' ? 'text-indigo-600' : 'text-slate-400'}`}
                    >
                        <Archive className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Stock</span>
                    </button>
                    <button
                        onClick={() => dispatch(setActiveTab('SETTINGS'))}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'SETTINGS' ? 'text-indigo-600' : 'text-slate-400'}`}
                    >
                        <Settings className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Settings</span>
                    </button>
                    <button
                        onClick={() => dispatch(setSidebarOpen(true))}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 text-slate-400`}
                    >
                        <Menu className="w-5 h-5" />
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </nav>

                {/* Sidebar Component */}
                <Sidebar onLogout={handleLogout} />

                {/* Main Content */}
                <main className="flex-1 overflow-hidden w-full bg-slate-50 dark:bg-slate-900 relative">
                    <div className="h-full w-full overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6 custom-scrollbar text-slate-900 dark:text-slate-100">
                        <Routes>
                            <Route path="/" element={renderContent()} />
                            <Route path="/reports" element={<ReportsModule />} />
                            <Route path="/reports/:category/:slug" element={<ReportsModule />} />
                            <Route path="/suppliers/add" element={<VendorForm />} />
                            <Route path="/suppliers/:id" element={<VendorDetails />} />
                            <Route path="/suppliers/:id/edit" element={<EditSupplier />} />
                            <Route path="/purchase/new" element={<PurchaseEntry />} />
                            <Route path="/grow" element={<GrowBusiness />} />
                            <Route path="*" element={renderContent()} />
                        </Routes>
                    </div>
                </main>

                {/* Overlay for mobile sidebar */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => dispatch(setSidebarOpen(false))}
                    />
                )}

                {/* Modals */}
                <ChangePasswordModal
                    isOpen={isChangePasswordOpen}
                    onClose={() => setIsChangePasswordOpen(false)}
                />

                {/* Confirmation Modal */}
                {confirmDialog.isOpen && (
                    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{confirmDialog.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">{confirmDialog.message}</p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ConfigProvider>
    );
};

export default TenantView;
