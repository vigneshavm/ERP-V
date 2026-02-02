import React from 'react';
import { Vendor } from "../../../types/vendor";

interface VendorKPIsProps {
    vendors: Vendor[];
    activeCount: number;
    inactiveCount: number;
}

const VendorKPIs: React.FC<VendorKPIsProps> = ({ vendors, activeCount, inactiveCount }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Total Suppliers</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{vendors.length}</h3>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-emerald-500">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">Active Suppliers</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{activeCount}</h3>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm border-l-4 border-l-slate-400">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Inactive Suppliers</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{inactiveCount}</h3>
            </div>
        </div>
    );
};

export default VendorKPIs;
