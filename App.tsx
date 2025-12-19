
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setSector, setBranch, toggleTheme } from './store';
import { LayoutDashboard, ShoppingCart, Archive, DollarSign, Users, FileText, Settings, Layers, Box, MapPin, ChevronDown, History, Moon, Sun, PieChart, Wallet } from 'lucide-react';

import Dashboard from './components/Dashboard';
import POSModule from './components/POSModule';
import InventoryManager from './components/InventoryManager';
import PurchaseManager from './components/PurchaseManager';
import FinanceTracker from './components/FinanceTracker';
import LaborManager from './components/LaborManager';
import SalesHistory from './components/SalesHistory';
import DailyFinanceTracker from './components/DailyFinanceTracker';
import { LaborSalaryManager } from './components/LaborSalaryManager';
import { Sector, Branch } from './types';

const Header: React.FC = () => {
    const dispatch = useDispatch();
    const { currentSector, currentBranch, theme } = useSelector((state: RootState) => state.auth);
    const sectors: Sector[] = ['General', 'Textile', 'Electronics'];
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

                {/* Theme Toggle */}
                <button 
                    onClick={() => dispatch(toggleTheme())}
                    className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-yellow-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                <button className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}

const App: React.FC = () => {
  const { theme } = useSelector((state: RootState) => state.auth);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const NavItem = ({ view, icon: Icon, label }: any) => {
    const isActive = currentView === view;
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
    switch (currentView) {
        case 'dashboard': return <Dashboard />;
        case 'pos': return <POSModule />;
        case 'sales': return <SalesHistory />;
        case 'daily': return <DailyFinanceTracker />;
        case 'inventory': return <InventoryManager />;
        case 'purchases': return <PurchaseManager />;
        case 'finance': return <FinanceTracker />;
        case 'labor': return <LaborManager />;
        case 'salary': return <LaborSalaryManager />;
        default: return <Dashboard />;
    }
  };

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
                </div>
                
                <div className="mb-6">
                    <p className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Management</p>
                    <NavItem view="inventory" icon={Archive} label="Inventory" />
                    <NavItem view="purchases" icon={FileText} label="Restock & AI" />
                    <NavItem view="finance" icon={DollarSign} label="Finance" />
                    <NavItem view="labor" icon={Users} label="Staff & Attendance" />
                    <NavItem view="salary" icon={Wallet} label="Salary & Payments" />
                </div>
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-slate-300 dark:border-slate-600"></div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Admin User</p>
                        <p className="text-xs text-slate-500">Super Admin</p>
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
