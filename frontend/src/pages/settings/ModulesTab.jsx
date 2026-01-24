import React from 'react';
import { ShoppingCart, Package, CreditCard, Users, Truck, BarChart3, ChevronRight, CheckCircle2, Zap } from 'lucide-react';

const ModulesTab = ({ modules, handleModuleToggle }) => {
    const modulesList = [
        { id: 'pos', name: 'Point of Sale (POS)', icon: ShoppingCart, desc: 'Advanced multi-counter billing with offline support', color: 'indigo' },
        { id: 'inventory', name: 'Inventory Management', icon: Package, desc: 'Stock tracking, bulk updates and audit logs', color: 'emerald' },
        { id: 'finance', name: 'Finance & Accounting', icon: CreditCard, desc: 'P&L, balance sheets, and tax compliance', color: 'amber' },
        { id: 'customers', name: 'CRM & Loyalty', icon: Users, desc: 'Manage customer relations and loyalty programs', color: 'blue' },
        { id: 'suppliers', name: 'Vendor Management', icon: Truck, desc: 'Supplier database, purchase orders and dues', color: 'violet' },
        { id: 'reports', name: 'Advanced Analytics', icon: BarChart3, desc: 'Deep-dive reports and Profit Pulse AI', color: 'rose' }
    ];

    return (
        <div className="p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Advisory */}
            <div className="bg-slate-900 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 border border-slate-800 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Zap className="w-48 h-48 text-indigo-500" />
                </div>
                <div className="relative z-10 w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-xl shadow-indigo-500/20">
                    <Zap className="w-10 h-10 text-white" />
                </div>
                <div className="relative z-10 flex-1 text-center md:text-left">
                    <h3 className="text-xl font-black text-white leading-none mb-2">Enterprise Capabilities</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xl">
                        Enable or disable core system modules to customize your enterprise experience. Disabling a module hides its menus and restricts data access for all terminal users.
                    </p>
                </div>
                <div className="relative z-10 flex gap-4">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active</p>
                        <p className="text-xl font-black text-white">{Object.values(modules).filter(Boolean).length}</p>
                    </div>
                    <div className="w-[1px] h-10 bg-slate-800" />
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-xl font-black text-white">{modulesList.length}</p>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modulesList.map((mod) => {
                    const Icon = mod.icon;
                    const isEnabled = modules[mod.id];
                    return (
                        <div key={mod.id} className={`group p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-full ${isEnabled
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500'
                            : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-700 opacity-60 grayscale hover:grayscale-0 transition-all'
                            }`}>
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${isEnabled
                                        ? `bg-${mod.color}-50 dark:bg-${mod.color}-900/20 text-${mod.color}-600 dark:text-${mod.color}-400`
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                        }`}>
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={isEnabled}
                                            onChange={() => handleModuleToggle(mod.id)}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                                <h4 className={`text-base font-black leading-none mb-2 ${isEnabled ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>{mod.name}</h4>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-6">{mod.desc}</p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                                {isEnabled ? (
                                    <div className="flex items-center gap-1.5 text-emerald-500">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black tracking-widest uppercase">Operational</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Disabled</span>
                                )}
                                <button className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:gap-2 transition-all">
                                    SETTINGS <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Capability Limitation Alert */}
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-2xl flex items-center justify-between text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <p className="text-xs font-bold uppercase tracking-wide">Enterprise Feature Control</p>
                </div>
                <p className="text-[11px] font-medium opacity-80 italic">Need more modules? Check your current subscription plan.</p>
            </div>
        </div>
    );
};

export default ModulesTab;
