import React from 'react';
import { LayoutGrid } from 'lucide-react';

interface ModulesTabProps {
    modules: { [key: string]: boolean };
    handleModuleToggle: (id: string) => void;
}

const MODULE_LIST = [
    { id: 'pos', label: 'Point of Sale' },
    { id: 'inventory', label: 'Inventory Management' },
    { id: 'finance', label: 'Finance & Accounting' },
    { id: 'labor', label: 'Staff & Payroll' },
    { id: 'purchases', label: 'Purchase & AI' },
    { id: 'sales', label: 'Sales History' },
    { id: 'daily', label: 'Daily Tracker' },
    { id: 'storefront', label: 'Web Storefront' },
];

const ModulesTab: React.FC<ModulesTabProps> = ({ modules, handleModuleToggle }) => {
    return (
        <div className="p-6 md:p-8 space-y-8">
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-indigo-500" /> Feature Modules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {MODULE_LIST.map(mod => (
                        <div key={mod.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${modules[mod.id] ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${modules[mod.id] ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                                <span className={`font-bold ${modules[mod.id] ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-500'}`}>{mod.label}</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={modules[mod.id]}
                                    onChange={() => handleModuleToggle(mod.id)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    ))}
                </div>
                <p className="text-xs text-slate-400 mt-6 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 inline-block">
                    <span className="font-bold">Note:</span> Disabling a module hides it from the sidebar for ALL users immediately. Data remains intact.
                </p>
            </div>
        </div>
    );
};

export default ModulesTab;
