import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Archive,
    Users,
    Menu,
    X,
    Shield,
    Store,
    LogOut,
    ArrowRight,
    DollarSign,
    List,
    ShoppingBag,
    Settings,
    Lock,
    Ban,
    Zap,
    LucideIcon,
    Clock,
    ChevronLeft,
    ChevronRight,
    FileText,
    Key,
    Plus,
    Landmark,
    Rocket,
    Share2,
    RotateCcw,
    Barcode,
    FileUp,
    FileDown,
    Megaphone,
    Globe,
    RefreshCw,
    Database
} from 'lucide-react';

import { RootState, setActiveTab, setSidebarOpen, setDesktopCollapsed, setBranch } from '../store';
import { clearSession } from '../utils/session';
import { useBranchResolver } from '../hooks/useBranchResolver';
import { ConfigProvider, useConfig } from '../components/ConfigProvider';
import NavItem from '../components/layout/NavItem';
import NavGroup from '../components/layout/NavGroup';
import NavSubmenu from '../components/layout/NavSubmenu';
import { usePermissions } from '../hooks/usePermissions';
import ChangePasswordModal from '../components/ChangePasswordModal';
import { Tenant } from '../types/tenant';
import {
    DashboardSkeleton,
    GridSkeleton,
    TableSkeleton,
    FormSkeleton
} from '../components/layout/SkeletonLoader';
import EntitlementGuard from '../components/layout/EntitlementGuard';
import { LazyModules } from '../services/ModuleRegistry';

// Keep non-standard or highly specific lazy loads locally for now if needed, 
// but most are moved to the registry.
// Local lazy loads removed - now using LazyModules from ModuleRegistry

interface TenantViewProps {
    currentTenant: Tenant | null;
    isLoggedIn: boolean;
    onLogin: () => void;
    onLogout: () => void;
}

const TenantView: React.FC<TenantViewProps> = ({ currentTenant, isLoggedIn, onLogin, onLogout }) => {
    const dispatch = useDispatch();
    const { user, role } = useSelector((state: RootState) => state.auth);
    const { tenants, branches: branchesFromDB } = useSelector((state: RootState) => state.tenant);
    const { activeTab, sidebarOpen, desktopCollapsed } = useSelector((state: RootState) => state.ui);
    const selectedBranch = useSelector((state: RootState) => state.auth.currentBranch);

    const { getBranchName } = useBranchResolver();
    const { checkAccess } = usePermissions();
    const location = useLocation();

    // Sync active tab with URL
    useEffect(() => {
        const path = location.pathname;
        if (path === '/') dispatch(setActiveTab('DASHBOARD'));
    }, [location.pathname, dispatch]);

    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    const effectiveTenant = useMemo(() => {
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

    if (!isLoggedIn) {
        return (
            <ConfigProvider tenant={effectiveTenant}>
                <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Login...</div>}>
                    <LazyModules.Login
                        tenant={effectiveTenant}
                        onLogin={onLogin}
                    />
                </Suspense>
            </ConfigProvider>
        );
    }

    const renderContent = () => {
        if (!checkAccess(activeTab)) {
            return (
                <EntitlementGuard
                    view={activeTab}
                    moduleName={activeTab.split('_')[0].charAt(0) + activeTab.split('_')[0].slice(1).toLowerCase()}
                >
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400 animate-in fade-in">
                        <Ban className="w-16 h-16 mb-4 text-error/80 opacity-80" />
                        <h2 className="text-2xl font-bold text-neutral-600 dark:text-neutral-300">Role Access Denied</h2>
                        <p className="mt-2 text-sm">Your role ({role}) does not have permission to view this specific view.</p>
                    </div>
                </EntitlementGuard>
            );
        }

        const getLoader = () => {
            if (activeTab.includes('DASHBOARD')) return <DashboardSkeleton />;
            if (activeTab.includes('INVENTORY') || activeTab.includes('STOREFRONT')) return <GridSkeleton />;
            if (activeTab.includes('REGISTER') || activeTab.includes('HISTORY') || activeTab.includes('LEDGER') || activeTab.includes('LIST')) return <TableSkeleton />;
            if (activeTab.includes('ENTRY') || activeTab.includes('FORM') || activeTab.includes('CREATOR')) return <FormSkeleton />;
            return <DashboardSkeleton />; // Fallback Default
        };

        return (
            <Suspense fallback={<div className="p-4 animate-in fade-in duration-500">{getLoader()}</div>}>
                {(() => {
                    switch (activeTab) {
                        // === DASHBOARD ===
                        case 'DASHBOARD': return <LazyModules.Dashboard />;
                        case 'PROFIT_PULSE': return <LazyModules.ProfitPulse />;
                        case 'DASHBOARD_SNAPSHOT': return <LazyModules.BusinessSnapshot />;
                        case 'DASHBOARD_OVERVIEW': return <LazyModules.Dashboard />;
                        case 'DASHBOARD_SUMMARY': return <LazyModules.DailyFinanceTracker />; // Today's Summary

                        // Sales
                        case 'SALES':
                        case 'SALES_REGISTER': return <LazyModules.Sales />;
                        case 'SALES_INVOICE': return <LazyModules.SalesInvoiceRegister />;
                        case 'ESTIMATE': return <LazyModules.EstimateCreator />;
                        case 'SALES_ORDER': return <LazyModules.SalesOrderCreator />;
                        case 'DELIVERY_CHALLAN': return <LazyModules.DeliveryChallanCreator />;
                        case 'SALES_RETURN': return <LazyModules.SalesReturn />;
                        case 'PAYMENT_IN': return <LazyModules.PaymentInCreator />;
                        case 'PAYMENT_IN_LIST': return <LazyModules.PaymentInList />;
                        case 'CHALLAN_LIST': return <LazyModules.SalesModulePlaceholder view="CHALLAN_LIST" />;
                        case 'INVOICE_REGISTER': return <LazyModules.SalesModulePlaceholder view="INVOICE_REGISTER" />;
                        case 'ORDER_REGISTER': return <LazyModules.SalesModulePlaceholder view="ORDER_REGISTER" />;
                        case 'RETURNED_ITEMS': return <LazyModules.ReturnedItemsManager />;
                        case 'CUSTOMER_CREDITS': return <LazyModules.CustomerCredits />;
                        case 'OUTSTANDING_DUES': return <LazyModules.OutstandingDues />;

                        // Purchase
                        case 'PURCHASE': return <LazyModules.Purchase />; // Legacy
                        case 'PURCHASE_REGISTER': return <LazyModules.PurchaseRegister />;
                        case 'PURCHASE_ENTRY': return <LazyModules.PurchaseEntry />;
                        case 'PURCHASE_ORDER': return <LazyModules.PurchaseOrdersModule />;
                        case 'VENDORS': // Legacy mapping to Supplier List
                        case 'SUPPLIER_LIST': return <LazyModules.VendorManager />;
                        case 'VENDOR_DETAILS': return <LazyModules.VendorDetails />;
                        case 'VENDOR_FORM': return <LazyModules.VendorForm />;
                        case 'GOODS_RECEIVED': return <LazyModules.GoodsReceived />;
                        case 'DEBIT_NOTES': return <LazyModules.DebitNotes />;
                        case 'SUPPLIER_PAYMENTS': return <LazyModules.SupplierPayments />;
                        case 'OUTSTANDING_PAYABLES': return <LazyModules.OutstandingPayables />;

                        // Customers
                        case 'CUSTOMER_LIST': return <LazyModules.CustomerList />;
                        case 'CUSTOMER_LEDGER': return <LazyModules.CustomerLedger />;
                        case 'CUSTOMER_STATEMENTS': return <LazyModules.CustomerStatements />;
                        case 'CUSTOMER_GROUPS': return <LazyModules.CustomerGroups />;
                        case 'LOYALTY_POINTS': return <LazyModules.LoyaltyPoints />;

                        // Suppliers
                        case 'SUPPLIER_LEDGER': return <LazyModules.SupplierLedger />;
                        case 'SUPPLIER_STATEMENTS': return <LazyModules.SupplierStatements />;
                        case 'SUPPLIER_GROUPS': return <LazyModules.SupplierGroups />;

                        // Inventory
                        case 'INVENTORY': return <LazyModules.Inventory />;
                        case 'INVENTORY_ITEMS': return <LazyModules.Inventory />; // Map to existing Inventory
                        case 'AGED_STOCK': return <LazyModules.AgedStockManager />;
                        case 'ITEM_CATEGORIES': return <LazyModules.ItemCategories />;
                        case 'STOCK_SUMMARY': return <LazyModules.StockSummary />;
                        case 'STOCK_MOVEMENT': return <LazyModules.StockMovement />;
                        case 'LOW_STOCK_ALERTS': return <LazyModules.LowStockAlerts />;
                        case 'UNITS_HSN': return <LazyModules.UnitsHSNAgent />;
                        case 'WAREHOUSES': return <LazyModules.WarehouseIntelligence />;
                        case 'BATCH_EXPIRY': return <LazyModules.BatchExpiryIntelligence />;

                        // Finance
                        case 'FINANCE': return <LazyModules.Finance />;
                        case 'CASH_ACCOUNTS': return <LazyModules.CashBankIntelligence />;
                        case 'BANK_ACCOUNTS': return <LazyModules.BankIntelligence />;
                        case 'BANK_RECONCILIATION': return <LazyModules.BankReconciliationIntelligence />;
                        case 'FUND_TRANSFERS': return <LazyModules.FundTransferIntelligence />;
                        case 'PETTY_CASH': return <LazyModules.PettyCashIntelligence />;

                        // POS
                        case 'POS': return <LazyModules.POS />;
                        case 'POS_ORDERS': return <LazyModules.POSOrdersIntelligence />;
                        case 'POS_RETURNS': return <LazyModules.POSReturnsIntelligence />;
                        case 'SHIFT_MANAGEMENT': return <LazyModules.ShiftManagementIntelligence />;
                        case 'CASH_DRAWER': return <LazyModules.CashDrawerIntelligence />;

                        // Expenses
                        case 'EXPENSES': return <LazyModules.ExpensesModuleFeature />;
                        case 'EXPENSE_CATEGORIES': return <LazyModules.ExpenseCategoriesManager />;
                        case 'RECURRING_EXPENSES': return <LazyModules.RecurringExpensesIntelligence />;
                        case 'EXPENSE_REPORTS': return <LazyModules.ExpenseReportsIntelligence />;

                        // Reports
                        case 'REPORTS':
                        case 'REPORT_SALES': return <LazyModules.Reports view="REPORT_SALES" />;
                        case 'REPORT_PURCHASE': return <LazyModules.Reports view="REPORT_PURCHASE" />;
                        case 'REPORT_INVENTORY': return <LazyModules.Reports view="REPORT_INVENTORY" />;
                        case 'REPORT_CUSTOMER': return <LazyModules.Reports view="REPORT_CUSTOMER" />;
                        case 'REPORT_SUPPLIER': return <LazyModules.Reports view="REPORT_SUPPLIER" />;
                        case 'REPORT_TAX': return <LazyModules.Reports view="REPORT_TAX" />;
                        case 'REPORT_FINANCIAL':
                        case 'CASH_FLOW': return <LazyModules.Reports view="REPORT_FINANCIAL" />;
                        case 'DAY_BOOK': return <LazyModules.Reports view="DAY_BOOK" />;
                        case 'TRIAL_BALANCE': return <LazyModules.Reports view="TRIAL_BALANCE" />;
                        case 'PROFIT_LOSS': return <LazyModules.Reports view="PROFIT_LOSS" />;
                        case 'BALANCE_SHEET': return <LazyModules.Reports view="BALANCE_SHEET" />;

                        // Utilities
                        case 'BARCODE_GENERATOR':
                        case 'LABEL_PRINTING':
                        case 'BULK_IMPORT':
                        case 'DATA_EXPORT':
                        case 'NUMBER_SERIES': return <LazyModules.Data />;
                        case 'AUDIT_LOGS': return <LazyModules.SalesModulePlaceholder view={activeTab} />;

                        // Settings
                        case 'SETTINGS': return <LazyModules.Settings />;
                        case 'BUSINESS_PROFILE': return <Navigate to="/?tab=GENERAL" replace />;
                        case 'TAX_CONFIGURATION': return <Navigate to="/?tab=FINANCE" replace />;
                        case 'INVOICE_SETTINGS': return <Navigate to="/?tab=MIS" replace />;
                        case 'USERS_ROLES': return <Navigate to="/?tab=SECURITY" replace />;
                        case 'BRANCH_SETTINGS': return <Navigate to="/?tab=BRANCHES" replace />;
                        case 'FINANCIAL_YEAR': return <Navigate to="/?tab=FINANCE" replace />;
                        case 'INTEGRATIONS': return <Navigate to="/?tab=INTEGRATIONS" replace />;
                        case 'BACKUP_RESTORE': return <LazyModules.Sync />;
                        case 'THEMES_BRANDING': return <Navigate to="/?tab=BRANDING" replace />;

                        // HR
                        case 'LABOR': return <LazyModules.LaborManager />;
                        case 'DAILY': return <LazyModules.DailyFinanceTracker />;
                        case 'STOREFRONT': return <LazyModules.Storefront />;

                        // Grow Platform
                        case 'GROW_DASHBOARD':
                        case 'GROW_OVERVIEW': return <LazyModules.GrowDashboard />;
                        case 'GROW_MARKETING_METRICS': return <LazyModules.MarketingMetrics />;
                        case 'GROW_PERFORMANCE': return <LazyModules.OnlinePerformance />;
                        case 'GROW_HUB': return <LazyModules.GrowthHub />;

                        case 'GROW_STORE':
                        case 'GROW_STORE_SETUP':
                        case 'GROW_PRODUCT_SYNC':
                        case 'GROW_STORE_ORDERS':
                        case 'GROW_STORE_CUSTOMERS':
                        case 'GROW_STORE_PAYMENTS':
                        case 'GROW_STORE_THEMES':
                        case 'GROW_STORE_DOMAIN':
                        case 'GROW_STORE_SHIPPING': return <LazyModules.OnlineStore />;

                        case 'GROW_MARKETING':
                        case 'GROW_MARKETING_CAMPAIGNS': return <LazyModules.MarketingCampaigns />;
                        case 'GROW_MARKETING_TEMPLATES': return <LazyModules.MarketingTemplates />;
                        case 'GROW_MARKETING_EMAIL':
                        case 'GROW_ENGAGEMENT_EMAIL': return <LazyModules.EmailMarketing />;
                        case 'GROW_MARKETING_WHATSAPP':
                        case 'GROW_ENGAGEMENT_WHATSAPP': return <LazyModules.WhatsAppMarketing />;
                        case 'GROW_MARKETING_SOCIAL': return <LazyModules.SocialMediaMarketing />;
                        case 'GROW_MARKETING_COUPONS': return <LazyModules.MarketingCoupons />;
                        case 'GROW_MARKETING_OFFERS': return <LazyModules.MarketingOffers />;

                        case 'GROW_GOOGLE':
                        case 'GROW_GOOGLE_PROFILE':
                        case 'GROW_GOOGLE_REVIEWS':
                        case 'GROW_GOOGLE_POSTS':
                        case 'GROW_GOOGLE_INSIGHTS':
                        case 'GROW_GOOGLE_PHOTOS': return <LazyModules.GoogleBusiness />;

                        case 'GROW_ENGAGEMENT':
                        case 'GROW_ENGAGEMENT_SMS':
                        case 'GROW_ENGAGEMENT_LOYALTY':
                        case 'GROW_ENGAGEMENT_FEEDBACK': return <LazyModules.Marketing />; // Marketing handles engagement

                        case 'GROW_SYNC':
                        case 'GROW_SYNC_DEVICE':
                        case 'GROW_SYNC_CLOUD':
                        case 'GROW_BACKUP':
                        case 'GROW_RESTORE_DATA':
                        case 'GROW_SYNC_LOGS': return <LazyModules.Sync />;

                        case 'GROW_DATA':
                        case 'GROW_DATA_IMPORT':
                        case 'GROW_DATA_EXPORT':
                        case 'GROW_DATA_CLEANUP':
                        case 'GROW_DATA_DUPLICATES':
                        case 'GROW_DATA_HEALTH': return <LazyModules.Data />;

                        case 'GROW_REPORTS':
                        case 'GROW_REPORT_SALES':
                        case 'GROW_REPORT_ROI':
                        case 'GROW_REPORT_CUSTOMER':
                        case 'GROW_REPORT_TRAFFIC':
                        case 'GROW_REPORT_CONVERSION': return <LazyModules.GrowReports />;

                        // Fallback
                        default: return <LazyModules.Dashboard />;
                    }
                })()}
            </Suspense>
        );
    };

    return (
        <ConfigProvider tenant={effectiveTenant}>
            <div className="flex h-screen bg-neutral-50 overflow-hidden text-neutral-900 dark:text-neutral-100">
                {/* Mobile Bottom Navigation */}
                <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 z-50 flex justify-around items-center h-16 pb-safe">
                    {/* Keep minimal mobile nav or refactor? Keeping explicit for now as Sidebar is desktop focused mostly */}
                    <button
                        onClick={() => dispatch(setActiveTab('DASHBOARD'))}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'DASHBOARD' ? 'text-primary' : 'text-neutral-400'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Home</span>
                    </button>
                    <button
                        onClick={() => dispatch(setActiveTab('POS'))}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'POS' ? 'text-primary' : 'text-neutral-400'}`}
                    >
                        <ShoppingCart className="w-5 h-5" />
                        <span className="text-[10px] font-medium">POS</span>
                    </button>
                    <button
                        onClick={() => dispatch(setSidebarOpen(true))}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 text-neutral-400`}
                    >
                        <Menu className="w-5 h-5" />
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </nav>

                {/* Sidebar Component */}
                <Sidebar onLogout={onLogout} />

                {/* Main Content */}
                <main className="flex-1 overflow-hidden w-full bg-neutral-50 dark:bg-neutral-900 relative">
                    <div className="h-full w-full overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6 custom-scrollbar text-neutral-900 dark:text-neutral-100">
                        <Routes>
                            <Route path="/" element={renderContent()} />
                            <Route path="/suppliers/:id" element={
                                <EntitlementGuard module="SUPPLIERS">
                                    <Suspense fallback={<div>Loading Vendor...</div>}><LazyModules.VendorDetails /></Suspense>
                                </EntitlementGuard>
                            } />
                            <Route path="/suppliers/:id/edit" element={
                                <EntitlementGuard module="SUPPLIERS">
                                    <Suspense fallback={<div>Loading Vendor Form...</div>}><LazyModules.VendorForm /></Suspense>
                                </EntitlementGuard>
                            } />
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
                        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl p-6 max-w-sm w-full border border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{confirmDialog.title}</h3>
                            <p className="text-neutral-500 dark:text-neutral-400 mb-6">{confirmDialog.message}</p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                                    className="px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-4 py-2 bg-error hover:bg-error/90 text-white rounded-lg font-bold transition-colors"
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
