
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setSector, setBranch, toggleTheme, logout } from '../../store';
import { LayoutDashboard, ShoppingCart, Archive, DollarSign, Users, FileText, Settings, Layers, Box, MapPin, ChevronDown, History, Moon, Sun, PieChart, Wallet, LogOut, ShieldAlert, ShoppingBag } from 'lucide-react';

import Dashboard from './components/Dashboard';
import POSModule from './components/POSModule';
import InventoryManager from './components/InventoryManager';
import PurchaseManager from './components/PurchaseManager';
import FinanceTracker from './components/FinanceTracker';
import LaborManager from './components/LaborManager';
import SalesHistory from './components/SalesHistory';
import DailyFinanceTracker from './components/DailyFinanceTracker';
import Storefront from './components/Storefront';
import Login from './components/login';
import { Sector, Branch, AppView } from '../../types';
import { hasAccess } from '../config';

const Header: React.FC = () => {
    const dispatch = useDispatch();
    const { currentSector, currentBranch, theme, user, role } = useSelector((state: RootState) => state.auth);
    const sectors: Sector[] = ['Supermarket', 'Textile', 'Mobile Shop'];
    const branches: Branch[] = ['All', 'Alpha', 'Beta', 'Gamma'];

    return (
        <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between px-8 z-10 sticky top-0 shadow-sm transition-colors duration-300">
            <div className="md:hidden font-bold text-xl flex items-center gap-2 text-slate-900 dark:text-white">
                 <Box className="w-6 h-6 text-indigo-500" />
                 <span>Ent<span className="text-indigo-500">Mgr</span></span>
            </div>

            <div className="hidden md:flex flex-col">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">Overview</h2>
                <p className="text-xs text-slate-500 font-medium">{currentSector} &bull; {currentBranch === 'All' ? 'All Branches' : `Branch ${currentBranch}`}</p>
            </div>

            <div className="flex items-center gap-4 ml-auto">
                {/* Sector Selector */}
                <div className="relative group">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{currentSector}</span>
                        <ChevronDown className="w-3 h-3 text-slate-500" />
                        <select 
                            value={currentSector} 
                            onChange={(e) => dispatch(setSector(e.target.value as Sector))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        >
                            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Branch Selector */}
                <div className="relative group">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <MapPin className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{currentBranch}</span>
                        <ChevronDown className="w-3 h-3 text-slate-500" />
                        <select 
                            value={currentBranch} 
                            onChange={(e) => dispatch(setBranch(e.target.value as Branch))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        >
                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

                <div className="text-right hidden lg:block">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{user}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{role}</p>
                </div>

                {/* Theme Toggle */}
                <button 
                    onClick={() => dispatch(toggleTheme())}
                    className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-yellow-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <button 
                    onClick={() => dispatch(logout())}
                    className="p-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}

const Unauthorized: React.FC = () => (
    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full mb-4">
            <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Access Denied</h2>
        <p className="text-sm">You do not have permission to view this module.</p>
    </div>
);

const App: React.FC = () => {
  const { theme, isAuthenticated, role } = useSelector((state: RootState) => state.auth);
  const [currentView, setCurrentView] = useState<AppView>('pos'); // Default to POS for safety

  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Security Check: If login role changes and current view is not allowed, reset to POS
  useEffect(() => {
      if (isAuthenticated && role) {
          if (!hasAccess(role, currentView)) {
              // Add simple check for storefront which might be public in future but currently restricted by role logic
              if (currentView !== 'storefront') setCurrentView('pos');
          }
      }
  }, [role, isAuthenticated]);

  const NavItem = ({ view, icon: Icon, label }: { view: AppView, icon: any, label: string }) => {
    const isActive = currentView === view;
    // Allow storefront access for now or check generic permissions
    const isAllowed = view === 'storefront' ? true : hasAccess(role, view);

    if (!isAllowed) return null;

    return (
        <button 
            onClick={() => setCurrentView(view)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
        >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
        </button>
    );
  };

  const renderContent = () => {
    // Basic role check
    if (currentView !== 'storefront' && !hasAccess(role, currentView)) {
        return <Unauthorized />;
    }

    switch (currentView) {
        case 'dashboard': return <Dashboard />;
        case 'pos': return <POSModule />;
        case 'sales': return <SalesHistory />;
        case 'daily': return <DailyFinanceTracker />;
        case 'inventory': return <InventoryManager />;
        case 'purchases': return <PurchaseManager />;
        case 'finance': return <FinanceTracker />;
        case 'labor': return <LaborManager />;
        case 'storefront': return <Storefront />;
        default: return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
      return (
          <div className={theme === 'dark' ? 'dark' : ''}>
              <Login />
          </div>
      );
  }

  return (
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30 transition-colors duration-300">
        
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex z-20 transition-colors duration-300">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Box className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Enterprise<span className="text-indigo-500">Mgr</span></h1>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">ERP & POS System</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <div className="mb-6">
                    <p className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Operations</p>
                    <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem view="pos" icon={ShoppingCart} label="Point of Sale" />
                    <NavItem view="sales" icon={History} label="Sales History" />
                    <NavItem view="daily" icon={PieChart} label="Daily Tracker" />
                    <NavItem view="storefront" icon={ShoppingBag} label="Web Storefront" />
                </div>
                
                <div className="mb-6">
                    <p className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Management</p>
                    <NavItem view="inventory" icon={Archive} label="Inventory" />
                    <NavItem view="purchases" icon={FileText} label="Restock & AI" />
                    <NavItem view="finance" icon={DollarSign} label="Finance" />
                    <NavItem view="labor" icon={Users} label="Staff & Payroll" />
                </div>
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-slate-300 dark:border-slate-600 flex items-center justify-center text-white font-bold text-xs">
                        {role[0]}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{role === 'Owner' ? 'Administrator' : 'Staff Member'}</p>
                        <p className="text-xs text-slate-500">{role}</p>
                    </div>
                </div>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
            <Header />
            {/* Scrollable Page Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
                {renderContent()}
            </div>
        </main>
      </div>
  );
};

export default App;
