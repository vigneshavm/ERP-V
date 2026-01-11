import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route } from 'react-router-dom';
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
    FileDown
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

// Lazy loading for modules
const Dashboard = lazy(() => import('../components/Dashboard'));
const ProfitPulse = lazy(() => import('../components/ProfitPulse'));
const AgedStockManager = lazy(() => import('../components/AgedStockManager'));
const POSModule = lazy(() => import('../components/pos/POSModule'));
const InventoryManager = lazy(() => import('../components/InventoryManager'));
const PurchaseManager = lazy(() => import('../components/PurchaseManager'));
const PurchaseEntry = lazy(() => import('../components/purchase/PurchaseEntry'));
const VendorManager = lazy(() => import('../components/VendorManager'));
const ExpensesModule = lazy(() => import('../components/expenses/ExpensesModule'));
const PurchaseOrdersModule = lazy(() => import('../components/purchase/orders/PurchaseOrdersModule'));
const FinanceTracker = lazy(() => import('../components/FinanceTracker'));
const SalesHistory = lazy(() => import('../components/SalesHistory'));
const DailyFinanceTracker = lazy(() => import('../components/DailyFinanceTracker'));
const LaborManager = lazy(() => import('../components/LaborManager'));
const Storefront = lazy(() => import('../components/Storefront'));
const SettingsManager = lazy(() => import('../components/SettingsManager'));
const VendorForm = lazy(() => import('../components/VendorForm'));
const VendorDetails = lazy(() => import('../components/VendorDetails'));
const ReportsModule = lazy(() => import('../components/reports/ReportsModule'));
const GrowBusiness = lazy(() => import('../components/grow/GrowBusiness'));
const SyncAndShare = lazy(() => import('../components/SyncAndShare'));
const RestoreManagement = lazy(() => import('../components/RestoreManagement'));
const BarcodeGenerator = lazy(() => import('../components/BarcodeGenerator'));
const BulkImport = lazy(() => import('../components/BulkImport'));
const DataExport = lazy(() => import('../components/DataExport'));
const Login = lazy(() => import('../components/login'));
const SalesModulePlaceholder = lazy(() => import('../components/sales/SalesModulePlaceholder'));
const SalesReturn = lazy(() => import('../components/sales/SalesReturn'));
const ReturnedItemsManager = lazy(() => import('../components/sales/ReturnedItemsManager'));
const SalesInvoiceRegister = lazy(() => import('../components/sales/SalesInvoiceRegister'));
const EstimateCreator = lazy(() => import('../components/sales/EstimateCreator'));
const PaymentInCreator = lazy(() => import('../components/sales/PaymentInCreator'));
const PaymentInList = lazy(() => import('../components/sales/PaymentInList'));
const SalesOrderCreator = lazy(() => import('../components/sales/SalesOrderCreator'));
const DeliveryChallanCreator = lazy(() => import('../components/sales/DeliveryChallanCreator'));

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
                    <Login
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
                <div className="flex flex-col items-center justify-center h-full text-neutral-400 animate-in fade-in">
                    <Ban className="w-16 h-16 mb-4 text-error/80 opacity-80" />
                    <h2 className="text-2xl font-bold text-neutral-600 dark:text-neutral-300">Access Denied</h2>
                    <p className="mt-2 text-sm">You do not have permission to view the {activeTab} module.</p>
                    <p className="text-xs mt-1">Role: {role}</p>
                </div>
            );
        }

        return (
            <Suspense fallback={<div className="h-full flex items-center justify-center"><Zap className="animate-pulse text-primary" /></div>}>
                {(() => {
                    switch (activeTab) {
                        case 'DASHBOARD': return <Dashboard />;
                        case 'PROFIT_PULSE': return <ProfitPulse />;
                        case 'AGED_STOCK': return <AgedStockManager />;
                        case 'POS': return <POSModule />;
                        case 'INVENTORY': return <InventoryManager />;
                        case 'PURCHASE': return <PurchaseManager />;
                        case 'VENDORS': return <VendorManager />;
                        case 'FINANCE': return <FinanceTracker />;
                        case 'SALES': return <SalesHistory />;
                        case 'DAILY': return <DailyFinanceTracker />;
                        case 'LABOR': return <LaborManager />;
                        case 'STOREFRONT': return <Storefront />;
                        case 'SETTINGS': return <SettingsManager />;
                        case 'VENDOR_FORM': return <VendorForm />;
                        case 'VENDOR_DETAILS': return <VendorDetails />;
                        case 'REPORTS': return <ReportsModule />;
                        case 'GROW': return <GrowBusiness />;
                        case 'SYNC_SHARE': return <SyncAndShare />;
                        case 'RESTORE': return <RestoreManagement />;
                        case 'BARCODE': return <BarcodeGenerator />;
                        case 'BULK_IMPORT': return <BulkImport />;
                        case 'DATA_EXPORT': return <DataExport />;
                        // Sales subviews
                        case 'SALES_INVOICE': return <SalesInvoiceRegister />;
                        case 'SALES_ORDER': return <SalesOrderCreator />;
                        case 'ESTIMATE': return <EstimateCreator />;
                        case 'DELIVERY_CHALLAN': return <DeliveryChallanCreator />;
                        case 'CHALLAN_LIST': return <SalesModulePlaceholder view="CHALLAN_LIST" />;
                        case 'PAYMENT_IN': return <PaymentInCreator />;
                        case 'PAYMENT_IN_LIST': return <PaymentInList />;
                        case 'SALES_RETURN': return <SalesReturn />;
                        case 'RETURNED_ITEMS': return <ReturnedItemsManager />;
                        case 'INVOICE_REGISTER': return <SalesModulePlaceholder view="INVOICE_REGISTER" />;
                        case 'ORDER_REGISTER': return <SalesModulePlaceholder view="ORDER_REGISTER" />;
                        case 'PURCHASE_ENTRY': return <PurchaseEntry />;
                        case 'EXPENSES': return <ExpensesModule />;
                        case 'PURCHASE_ORDER': return <PurchaseOrdersModule />;
                        default: return <Dashboard />;
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
                        onClick={() => dispatch(setActiveTab('INVENTORY'))}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'INVENTORY' ? 'text-primary' : 'text-neutral-400'}`}
                    >
                        <Archive className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Stock</span>
                    </button>
                    <button
                        onClick={() => dispatch(setActiveTab('SETTINGS'))}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${activeTab === 'SETTINGS' ? 'text-primary' : 'text-neutral-400'}`}
                    >
                        <Settings className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Settings</span>
                    </button>
                    <button
                        onClick={() => dispatch(setSidebarOpen(true))}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 text-neutral-400`}
                    >
                        <Menu className="w-5 h-5" />
                        <span className="text-[10px] font-medium">More</span>
                    </button>
                </nav>

                {/* Sidebar */}
                <aside className={`
                fixed lg:static inset-y-0 left-0 z-40 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 p-2 flex flex-col transition-all duration-300 transform 
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${desktopCollapsed ? 'lg:w-20' : 'lg:w-64'}
            `}>
                    <div className={`flex items-center ${desktopCollapsed ? 'justify-center' : 'justify-between'} mb-4 mt-2 lg:mt-0 ${desktopCollapsed ? 'px-2' : 'px-4'}`}>
                        <div className="flex items-center space-x-2 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-success">
                                {useConfig().logoUrl ? (
                                    <img src={useConfig().logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                                ) : (
                                    <span className="font-bold text-white">{user?.name?.charAt(0) || effectiveTenant?.name?.charAt(0) || 'T'}</span>
                                )}
                            </div>
                            {!desktopCollapsed && (
                                <div className="overflow-hidden">
                                    <span className="text-lg font-bold tracking-tight block leading-none truncate">{user?.name || 'User'}</span>
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 uppercase font-bold tracking-wider">{role}</span>
                                </div>
                            )}
                        </div>
                        <button onClick={() => dispatch(setSidebarOpen(false))} className="lg:hidden text-neutral-400">
                            <X className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => dispatch(setDesktopCollapsed(!desktopCollapsed))}
                            className="hidden lg:flex p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                        >
                            {desktopCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className={`mb-6 ${desktopCollapsed ? 'px-2' : 'px-4'}`}>
                        {!desktopCollapsed && <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">{effectiveTenant?.name}</span>}

                        {(() => {
                            const availableBranches = (effectiveTenant?.locations?.flatMap(l => l.branches) ||
                                branchesFromDB.filter(b => b.tenantId === effectiveTenant?.id) || [])
                                .filter(Boolean);

                            if (availableBranches.length <= 1) return null;

                            return (
                                <div className="mt-2 text-center">
                                    {role === 'Owner' ? (
                                        <div className="relative">
                                            <select
                                                value={selectedBranch}
                                                onChange={(e) => dispatch(setBranch(e.target.value))}
                                                className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg py-1.5 px-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                                            >
                                                <option value="All">All Branches (HQ View)</option>
                                                {availableBranches.map(b => (
                                                    <option key={b.id || b.name} value={b.id || b.name}>{b.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                                            {getBranchName(selectedBranch)}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
                        <div className="px-3 pt-4 pb-2">
                            <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Main</h3>
                        </div>
                        {/* Dashboard */}
                        <NavItem id="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
                        <NavItem id="PROFIT_PULSE" icon={Zap} label="Profit Pulse AI" />

                        {/* Sales Section */}
                        <div className="px-3 pt-6 pb-2">
                            <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Sales & Finance</h3>
                        </div>

                        <NavGroup icon={DollarSign} label="Sales" defaultOpen>
                            <NavSubmenu icon={FileText} label="Transactions" defaultOpen>
                                <NavItem id="SALES_INVOICE" icon={FileText} label="Sales Invoice" isSubItem />
                                <NavItem id="SALES_ORDER" icon={ShoppingCart} label="Sales Order" isSubItem />
                                <NavItem id="ESTIMATE" icon={FileText} label="Estimate" isSubItem />
                                <NavItem id="DELIVERY_CHALLAN" icon={FileText} label="Delivery Challan" isSubItem />
                            </NavSubmenu>
                            <NavSubmenu icon={DollarSign} label="Payments">
                                <NavItem id="PAYMENT_IN" icon={DollarSign} label="Payment In" isSubItem />
                                <NavItem id="PAYMENT_IN_LIST" icon={List} label="Payment List" isSubItem />
                            </NavSubmenu>
                            <NavSubmenu icon={RotateCcw} label="Returns">
                                <NavItem id="SALES_RETURN" icon={RotateCcw} label="Sales Return" isSubItem />
                                <NavItem id="RETURNED_ITEMS" icon={List} label="Returned Items" isSubItem />
                            </NavSubmenu>
                            <NavSubmenu icon={List} label="Registers">
                                <NavItem id="INVOICE_REGISTER" icon={List} label="Invoice Register" isSubItem />
                                <NavItem id="ORDER_REGISTER" icon={List} label="Order Register" isSubItem />
                            </NavSubmenu>
                            <NavItem id="SALES" icon={List} label="Sales History" isSubItem />
                            <NavItem id="DAILY" icon={FileText} label="Daily Summary" isSubItem />
                        </NavGroup>

                        {/* Purchase */}
                        <NavGroup icon={ArrowRight} label="Purchase">
                            <NavItem id="PURCHASE_ORDER" icon={FileText} label="Purchase Orders" isSubItem />
                            <NavItem id="PURCHASE_ENTRY" icon={FileText} label="Purchase Entry" isSubItem />
                            <NavItem id="PURCHASE" icon={ShoppingBag} label="Old Purchase List" isSubItem />
                            <NavItem id="VENDORS" icon={Users} label="Suppliers" isSubItem />
                        </NavGroup>

                        {/* Finance */}
                        {/* Finance */}
                        <NavGroup icon={Landmark} label="Finance">
                            <NavItem id="FINANCE" icon={Landmark} label="Cash & Bank" isSubItem />
                            <NavItem id="EXPENSES" icon={DollarSign} label="Expenses" isSubItem />
                        </NavGroup>


                        {/* Operations Section */}
                        <div className="px-3 pt-6 pb-2">
                            <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Operations</h3>
                        </div>

                        {/* Inventory */}
                        <NavGroup icon={Archive} label="Inventory">
                            <NavItem id="INVENTORY" icon={Archive} label="Items & Stock" isSubItem />
                            <NavItem id="AGED_STOCK" icon={Clock} label="Aged Stock" isSubItem />
                        </NavGroup>

                        {/* POS */}
                        <NavItem id="POS" icon={ShoppingCart} label="Point of Sale" />

                        {/* Grow Section */}
                        <div className="px-3 pt-6 pb-2">
                            <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Growth & Tools</h3>
                        </div>

                        {/* Grow Business */}
                        <NavGroup icon={Rocket} label="Grow Business">
                            <NavItem id="GROW" icon={Rocket} label="Launch Online" isSubItem />
                            <NavItem id="STOREFRONT" icon={Store} label="Storefront" isSubItem />
                        </NavGroup>

                        {/* Sync & Backup */}
                        <NavGroup icon={Share2} label="Sync & Backup">
                            <NavItem id="SYNC_SHARE" icon={Share2} label="Sync & Share" isSubItem />
                            <NavItem id="RESTORE" icon={RotateCcw} label="Restore Data" isSubItem />
                        </NavGroup>

                        {/* Utilities */}
                        <NavGroup icon={Barcode} label="Utilities">
                            <NavItem id="BARCODE" icon={Barcode} label="Barcode Generator" isSubItem />
                            <NavItem id="BULK_IMPORT" icon={FileUp} label="Bulk Import" isSubItem />
                            <NavItem id="DATA_EXPORT" icon={FileDown} label="Data Export" isSubItem />
                        </NavGroup>

                        {/* HR - only if enabled */}
                        <NavItem id="LABOR" icon={Users} label="HR & Staff" />

                        <div className="mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <div className="px-3 pb-2">
                                <h3 className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">System</h3>
                            </div>
                            <NavItem id="SETTINGS" icon={Settings} label="Settings" />
                            <NavItem id="REPORTS" icon={FileText} label="Reports" />
                        </div>
                    </nav>

                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-2 space-y-2">
                        <button
                            onClick={() => {
                                requestConfirm('Lock Terminal', 'Lock terminal and return to PIN screen?', () => {
                                    onLogout();
                                });
                            }}
                            className={`w-full flex items-center ${desktopCollapsed ? 'hidden' : 'space-x-3 px-4'} py-3 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors`}
                        >
                            <Lock className="w-5 h-5" />
                            <span className="font-medium">Staff Logout</span>
                        </button>

                        {desktopCollapsed && (
                            <div className="flex flex-col gap-2 w-full px-2">
                                <button
                                    onClick={() => {
                                        requestConfirm('Lock Terminal', 'Lock terminal and return to PIN screen?', () => {
                                            onLogout();
                                        });
                                    }}
                                    title="Logout"
                                    className="flex-1 flex justify-center py-3 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <Lock className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setIsChangePasswordOpen(true)}
                                    title="Change Password"
                                    className="px-3 flex justify-center py-3 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-primary hover:bg-primary/10 dark:hover:bg-neutral-800 transition-colors"
                                >
                                    <Key className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-hidden w-full bg-neutral-50 dark:bg-neutral-900 relative">
                    <div className="h-full w-full overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6 custom-scrollbar text-neutral-900 dark:text-neutral-100">
                        <Routes>
                            <Route path="/" element={renderContent()} />
                            <Route path="/reports" element={<Suspense fallback={<div>Loading Reports...</div>}><ReportsModule /></Suspense>} />
                            <Route path="/reports/:category/:slug" element={<Suspense fallback={<div>Loading Reports...</div>}><ReportsModule /></Suspense>} />
                            <Route path="/suppliers/:id" element={<Suspense fallback={<div>Loading Vendor...</div>}><VendorDetails /></Suspense>} />
                            <Route path="/suppliers/:id/edit" element={<Suspense fallback={<div>Loading Vendor Form...</div>}><VendorForm /></Suspense>} />
                            <Route path="/grow" element={<Suspense fallback={<div>Loading...</div>}><GrowBusiness /></Suspense>} />
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
