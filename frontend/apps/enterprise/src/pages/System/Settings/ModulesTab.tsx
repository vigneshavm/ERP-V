import React, { useOptimistic, useTransition } from 'react';
import { 
    ShoppingCart, Package, CreditCard, Users, Truck, 
    BarChart3, ChevronRight, CheckCircle2, Zap, LucideIcon, 
    Briefcase, FileText, History, ClipboardList, Store,
    Sparkles, Activity
} from 'lucide-react';
import { ModulesTabProps, ModulesConfig } from './types';

interface ModuleDef {
    id: string;
    name: string;
    icon: LucideIcon;
    desc: string;
    color: string;
    category: 'CORE' | 'SALES' | 'GROWTH' | 'ADMIN';
}

const ModulesTab: React.FC<ModulesTabProps> = ({ modules, handleModuleToggle }) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isPending, startTransition] = useTransition();
    
    // React 19: useOptimistic for instant toggle feedback
    const [optimisticModules, setOptimisticModules] = useOptimistic(
        modules,
        (state: ModulesConfig, { id, enabled }: { id: string; enabled: boolean }) => ({
            ...state,
            [id]: enabled
        })
    );

    const modulesList: ModuleDef[] = [
        { id: 'pos', name: 'Point of Sale (POS)', icon: ShoppingCart, desc: 'Advanced multi-counter billing with offline support', color: 'indigo', category: 'SALES' },
        { id: 'inventory', name: 'Inventory Management', icon: Package, desc: 'Stock tracking, bulk updates and audit logs', color: 'emerald', category: 'CORE' },
        { id: 'finance', name: 'Finance & Accounting', icon: CreditCard, desc: 'P&L, balance sheets, and tax compliance', color: 'amber', category: 'CORE' },
        { id: 'labor', name: 'Staff & Payroll', icon: Briefcase, desc: 'Employee attendance, payroll and permissions', color: 'orange', category: 'ADMIN' },
        { id: 'customers', name: 'CRM & Loyalty', icon: Users, desc: 'Manage customer relations and loyalty programs', color: 'blue', category: 'GROWTH' },
        { id: 'suppliers', name: 'Vendor Management', icon: Truck, desc: 'Supplier database, purchase orders and dues', color: 'violet', category: 'CORE' },
        { id: 'purchases', name: 'Purchase & AI', icon: FileText, desc: 'Smart procurement and predictive ordering', color: 'cyan', category: 'CORE' },
        { id: 'sales', name: 'Sales History', icon: History, desc: 'Comprehensive transaction logs and returns', color: 'rose', category: 'SALES' },
        { id: 'daily', name: 'Daily Tracker', icon: ClipboardList, desc: 'End-of-day reports and cash reconciliation', color: 'lime', category: 'ADMIN' },
        { id: 'storefront', name: 'Web Storefront', icon: Store, desc: 'E-commerce listing and online orders', color: 'pink', category: 'GROWTH' },
        { id: 'reports', name: 'Advanced Analytics', icon: BarChart3, desc: 'Deep-dive reports and Profit Pulse AI', color: 'slate', category: 'GROWTH' }
    ];

    const toggleModule = (id: string) => {
        const currentlyEnabled = !!optimisticModules[id];
        startTransition(() => {
            setOptimisticModules({ id, enabled: !currentlyEnabled });
            handleModuleToggle(id);
        });
    };

    const categories = ['CORE', 'SALES', 'GROWTH', 'ADMIN'] as const;

    return (
        <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Advisory */}
            <div className="bg-[var(--erp-bg)] rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 border border-default shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <Zap className="w-64 h-64 text-indigo-500" />
                </div>
                <div className="relative z-10 w-24 h-24 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                    <Zap className="w-12 h-12 text-main animate-pulse" />
                </div>
                <div className="relative z-10 flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-black text-main italic uppercase tracking-tight mb-2">Enterprise <span className="text-indigo-400">Control Hub</span></h3>
                    <p className="text-muted text-sm font-medium leading-relaxed max-w-2xl">
                        Orchestrate your enterprise capabilities. Enabling modules propagates features across all terminal nodes in Real-time.
                    </p>
                </div>
                <div className="relative z-10 flex gap-8 bg-[var(--erp-card)]/50 p-6 rounded-3xl border border-default">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Operational</p>
                        <p className="text-2xl font-black text-main tabular-nums">{Object.values(optimisticModules).filter(Boolean).length}</p>
                    </div>
                    <div className="w-[1px] h-12 bg-slate-700" />
                    <div className="text-center">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Available</p>
                        <p className="text-2xl font-black text-muted tabular-nums">{modulesList.length}</p>
                    </div>
                </div>
            </div>

            {/* Categorized Modules */}
            {categories.map(category => (
                <section key={category} className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-100 dark:via-slate-800 to-transparent" />
                        <h3 className="text-[11px] font-black text-muted dark:text-muted uppercase tracking-[0.5em]">{category} DOMAIN</h3>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-100 dark:via-slate-800 to-transparent" />
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {modulesList.filter(m => m.category === category).map((mod) => {
                            const Icon = mod.icon;
                            const isEnabled = !!optimisticModules[mod.id];
                            return (
                                <div 
                                    key={mod.id} 
                                    className={`group p-8 rounded-[2.5rem] border transition-all duration-500 relative overflow-hidden h-full flex flex-col justify-between ${
                                        isEnabled
                                            ? 'bg-white dark:bg-[var(--erp-bg)] border-default dark:border-default shadow-sm hover:shadow-2xl hover:border-indigo-500 hover:-translate-y-1'
                                            : 'bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-card)]/20 border-default dark:border-default opacity-60 grayscale hover:grayscale-0'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-8">
                                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 group-hover:rotate-6 shadow-sm ${
                                                isEnabled
                                                    ? `bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400`
                                                    : 'bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] text-muted'
                                            }`}>
                                                <Icon className="w-8 h-8" />
                                            </div>
                                            
                                            {/* Toggle UI */}
                                            <button 
                                                onClick={() => toggleModule(mod.id)}
                                                className={`relative w-14 h-8 rounded-full transition-all duration-300 ring-4 ring-transparent hover:ring-offset-2 ${
                                                    isEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'
                                                }`}
                                            >
                                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md ${
                                                    isEnabled ? 'left-7' : 'left-1'
                                                }`} />
                                            </button>
                                        </div>
                                        
                                        <h4 className={`text-xl font-black italic uppercase leading-tight mb-2 transition-colors ${
                                            isEnabled ? 'text-main' : 'text-muted'
                                        }`}>
                                            {mod.name}
                                        </h4>
                                        <p className="text-xs text-muted font-medium leading-relaxed mb-8 opacity-80">
                                            {mod.desc}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-default/50">
                                        {isEnabled ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-400">Propagated</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-300" />
                                                <span className="text-[10px] font-black tracking-widest uppercase text-muted">Offline</span>
                                            </div>
                                        )}
                                        <button className="p-2 text-muted hover:text-indigo-500 transition-colors">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Subtle Ambient Glow for Enabled Modules */}
                                    {isEnabled && (
                                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}

            {/* Scale-up Advisory */}
            <div className="bg-gradient-to-r from-indigo-600/5 via-indigo-600/10 to-indigo-600/5 border border-indigo-100 dark:border-indigo-900/30 rounded-[2rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-14 h-14 bg-white dark:bg-[var(--erp-bg)] rounded-2xl flex items-center justify-center shadow-sm">
                        <Sparkles className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">Enterprise Scalability</h4>
                        <p className="text-xs font-medium text-muted mt-1 max-w-md">Need cross-domain integration? Explore high-volume features in our Enterprise Suite.</p>
                    </div>
                </div>
                <button className="relative z-10 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all active:scale-95">
                    Explore Analytics II
                </button>
                <Activity className="absolute right-0 top-0 w-64 h-64 text-indigo-600/5 -mr-20 -mt-20 pointer-events-none" />
            </div>
        </div>
    );
};

export default ModulesTab;
