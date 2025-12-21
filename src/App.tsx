
import React, { useState, useMemo } from 'react';
import { LayoutDashboard, ShoppingCart, Archive, Users, Menu, X, Shield, Store, LogOut, ArrowRight, DollarSign, List, ShoppingBag, Settings, LogIn, Lock, Ban } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setUser } from './store';
import Dashboard from './components/Dashboard';
import POSModule from './components/POSModule';
import InventoryManager from './components/InventoryManager';
import PurchaseManager from './components/PurchaseManager';
import FinanceTracker from './components/FinanceTracker';
import LaborManager from './components/LaborManager';
import SalesHistory from './components/SalesHistory';
import DailyFinanceTracker from './components/DailyFinanceTracker';
import Storefront from './components/Storefront';
import SettingsManager from './components/SettingsManager';
import Login from './components/login';
import TenantManager from './components/TenantManager';
import { ConfigProvider } from './components/ConfigProvider';
import { Tenant, AppView } from './types';

type ViewMode = 'LANDING' | 'ADMIN' | 'TENANT';

const App: React.FC = () => {
    const dispatch = useDispatch();
    const { user, role } = useSelector((state: RootState) => state.auth);
    const { rolePermissions } = useSelector((state: RootState) => state.settings);

    const [viewMode, setViewMode] = useState<ViewMode>('LANDING');
    const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);

    // --- Tenant specific state ---
    const [activeTab, setActiveTab] = useState<AppView>('DASHBOARD');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // --- Permission Helper ---
    const checkAccess = (view: AppView): boolean => {
        // 1. Check if user is logged in
        if (!user) return false;
        // 2. Owner has all permissions
        if (role === 'Owner') return true;
        // 3. Check specific role permissions
        const allowedViews = rolePermissions[role] || [];
        return allowedViews.includes(view);
    };

    // --- Views ---

    const LandingPage = () => (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full text-center mb-12">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/20">
                    <span className="font-bold text-3xl text-white">E</span>
                </div>
                <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Enterprise Manager</h1>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto">
                    The all-in-one ERP & POS platform for modern retail chains.
                    Manage inventory, sales, finance, and workforce from a single dashboard.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl w-full">
                <button
                    onClick={() => setViewMode('ADMIN')}
                    className="group relative bg-white p-8 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-blue-600 hover:shadow-xl transition-all duration-300 text-left"
                >
                    <div className="absolute top-6 right-6 text-slate-300 group-hover:text-blue-600 transition-colors">
                        <ArrowRight className="w-6 h-6" />
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Super Admin</h2>
                    <p className="text-slate-500">Provision new tenants, manage subscriptions, and oversee platform health.</p>
                </button>

                <button
                    onClick={() => {
                        // Setup demo tenant
                        setCurrentTenant({
                            id: 'demo',
                            name: 'Demo Retail Co',
                            subdomain: 'demo',
                            modules: ['POS', 'INVENTORY', 'FINANCE', 'HR'],
                            isActive: true,
                            region: { currency: 'USD', currencySymbol: '$', dateFormat: 'MM/DD/YYYY' }
                        });
                        setViewMode('TENANT');
                        setIsLoggedIn(false); // Force login
                    }}
                    className="group relative bg-white p-8 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-emerald-600 hover:shadow-xl transition-all duration-300 text-left"
                >
                    <div className="absolute top-6 right-6 text-slate-300 group-hover:text-emerald-600 transition-colors">
                        <ArrowRight className="w-6 h-6" />
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                        <Store className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Tenant Login</h2>
                    <p className="text-slate-500">Access your store's POS, Inventory, and Financial dashboards.</p>
                </button>
            </div>

            <p className="mt-12 text-sm text-slate-400">© 2024 Enterprise Manager Platform. All rights reserved.</p>
        </div>
    );

    const AdminView = () => (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
                        <span className="font-bold text-lg">Super Admin Portal</span>
                    </div>
                    <button
                        onClick={() => setViewMode('LANDING')}
                        className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </header>
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    <TenantManager onLoginAs={(tenant) => {
                        setCurrentTenant(tenant);
                        setViewMode('TENANT');
                        setIsLoggedIn(false);
                    }} />
                </div>
            </main>
        </div>
    );

    const TenantView = () => {
        // Confirmation State
        const [confirmDialog, setConfirmDialog] = useState<{
            isOpen: boolean;
            title: string;
            message: string;
            onConfirm: () => void;
        }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

        const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
            setConfirmDialog({ isOpen: true, title, message, onConfirm });
        };

        const handleConfirm = () => {
            confirmDialog.onConfirm();
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        };

        // 1. Check Login
        if (!isLoggedIn) {
            return (
                <ConfigProvider tenant={currentTenant}>
                    <Login
                        tenantName={currentTenant?.name || 'Retail Store'}
                        onLogin={() => setIsLoggedIn(true)}
                    />
                </ConfigProvider>
            );
        }

        // 2. Navigation Item Component
        const NavItem = ({ id, icon: Icon, label }: { id: AppView; icon: any; label: string }) => {
            // Hide if no access
            if (!checkAccess(id)) return null;

            return (
                <button
                    onClick={() => {
                        setActiveTab(id);
                        setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${activeTab === id
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                </button>
            );
        };

        // 3. Render Content (with Permission Check)
        const renderContent = () => {
            if (!checkAccess(activeTab)) {
                // Access Denied View
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
                case 'DASHBOARD': return <Dashboard />;
                case 'POS': return <POSModule />;
                case 'INVENTORY': return <InventoryManager />;
                case 'PURCHASE': return <PurchaseManager />;
                case 'FINANCE': return <FinanceTracker />;
                case 'SALES': return <SalesHistory />;
                case 'DAILY': return <DailyFinanceTracker />;
                case 'LABOR': return <LaborManager />;
                case 'STOREFRONT': return <Storefront />;
                case 'SETTINGS': return <SettingsManager />;
                default: return <Dashboard />;
            }
        };

        return (
            <ConfigProvider tenant={currentTenant}>
                <div className="flex h-screen bg-slate-50 overflow-hidden">
                    {/* Mobile Sidebar Toggle */}
                    <div className="lg:hidden fixed top-0 left-0 w-full bg-slate-900 text-white p-4 z-50 flex justify-between items-center">
                        <span className="font-bold text-lg">{currentTenant?.name || 'Ent. Manager'}</span>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    requestConfirm("Logout?", "Are you sure you want to log out?", () => setIsLoggedIn(false));
                                }}
                                className="text-slate-400 hover:text-white"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                            <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                                {sidebarOpen ? <X /> : <Menu />}
                            </button>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className={`
            fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 p-4 flex flex-col transition-transform duration-300 transform 
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
                        <div className="flex items-center space-x-2 px-4 mb-2 mt-2 lg:mt-0">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                                <span className="font-bold text-white">{user?.name.charAt(0) || 'T'}</span>
                            </div>
                            <div className="overflow-hidden">
                                <span className="text-lg font-bold tracking-tight block leading-none truncate">{user?.name || 'User'}</span>
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">{role}</span>
                            </div>
                        </div>

                        <div className="mb-6 px-4">
                            <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">{currentTenant?.name}</span>
                        </div>

                        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
                            <NavItem id="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
                            <NavItem id="POS" icon={ShoppingCart} label="Point of Sale" />
                            <NavItem id="INVENTORY" icon={Archive} label="Inventory" />
                            <NavItem id="PURCHASE" icon={ArrowRight} label="Purchases" />
                            <NavItem id="FINANCE" icon={DollarSign} label="Finance & P&L" />
                            <NavItem id="SALES" icon={List} label="Sales History" />
                            <NavItem id="DAILY" icon={LogOut} label="Daily Tracker" />
                            <NavItem id="LABOR" icon={Users} label="Labor & Staff" />
                            <NavItem id="STOREFRONT" icon={ShoppingBag} label="Web Storefront" />
                            <div className="pt-4 mt-4 border-t border-slate-800">
                                <NavItem id="SETTINGS" icon={Settings} label="Settings" />
                            </div>
                        </nav>

                        <div className="pt-4 border-t border-slate-800 mt-2 space-y-2">
                            <button
                                onClick={() => {
                                    requestConfirm('Lock Terminal', 'Lock terminal and return to PIN screen?', () => setIsLoggedIn(false));
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                            >
                                <Lock className="w-5 h-5" />
                                <span className="font-medium">Staff Logout</span>
                            </button>

                            <button
                                onClick={() => {
                                    requestConfirm('Switch Company', 'Switch company? This will end your session.', () => {
                                        setViewMode('LANDING');
                                        setCurrentTenant(null);
                                        setIsLoggedIn(false);
                                    });
                                }}
                                className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-red-400 transition-colors text-sm"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="font-medium">Switch Company</span>
                            </button>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 overflow-hidden w-full pt-16 lg:pt-0 bg-slate-50 dark:bg-slate-900 relative">
                        <div className="h-full w-full overflow-y-auto p-4 lg:p-6 custom-scrollbar">
                            {renderContent()}
                        </div>
                    </main>

                    {/* Overlay for mobile sidebar */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

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

    // --- Main Render ---

    if (viewMode === 'ADMIN') return <AdminView />;
    if (viewMode === 'TENANT') return <TenantView />;
    return <LandingPage />;
};

export default App;
