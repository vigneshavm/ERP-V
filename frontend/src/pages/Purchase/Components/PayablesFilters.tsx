import React from 'react';
import { Search } from 'lucide-react';

interface PayablesFiltersProps {
    viewMode: 'bill-wise' | 'vendor-wise';
    onViewModeChange: (mode: 'bill-wise' | 'vendor-wise') => void;
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    statusFilter: 'All' | 'Overdue' | 'Due Soon' | 'Future';
    onStatusFilterChange: (status: 'All' | 'Overdue' | 'Due Soon' | 'Future') => void;
    vendorFilter: string;
    onVendorFilterChange: (vendorId: string) => void;
    suppliers: any[];
}

const PayablesFilters: React.FC<PayablesFiltersProps> = ({
    viewMode,
    onViewModeChange,
    searchTerm,
    onSearchTermChange,
    statusFilter,
    onStatusFilterChange,
    vendorFilter,
    onVendorFilterChange,
    suppliers
}) => {
    return (
        <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                <button
                    onClick={() => onViewModeChange('bill-wise')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'bill-wise' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Bill-wise
                </button>
                <button
                    onClick={() => onViewModeChange('vendor-wise')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'vendor-wise' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Vendor-wise
                </button>
            </div>

            <div className="flex gap-2 flex-grow max-w-4xl">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search Vendor / Bill #..."
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value as any)}
                    className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
                >
                    <option value="All">All Statuses</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Due Soon">Due Soon</option>
                    <option value="Future">Future Dues</option>
                </select>

                <select
                    value={vendorFilter}
                    onChange={(e) => onVendorFilterChange(e.target.value)}
                    className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none max-w-[200px]"
                >
                    <option value="">All Vendors</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.businessName}</option>)}
                </select>
            </div>
        </div>
    );
};

export default PayablesFilters;
