import React from 'react';
import { Search, Filter, RefreshCcw, Database, Zap, ShieldCheck } from 'lucide-react';

interface GRNFiltersProps {
    searchTerm: string;
    onSearchChange: (val: string) => void;
    statusFilter: string;
    onStatusChange: (val: string) => void;
    dateFrom: string;
    onDateFromChange: (val: string) => void;
    dateTo: string;
    onDateToChange: (val: string) => void;
    onClear: () => void;
}

const GRNFilters: React.FC<GRNFiltersProps> = ({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
    onClear
}) => {
    return (
        <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[2.5rem] flex flex-col lg:flex-row gap-6 items-center justify-between border border-default dark:border-neutral-800">
            <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                {/* Search */}
                <div className="relative w-full md:w-80 group/search">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-neutral-400 group-focus-within/search:text-emerald-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search Record No, Vendor, PO..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3.5 bg-white dark:bg-neutral-900 border-none rounded-2xl text-xs font-bold placeholder:text-neutral-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-sm italic uppercase tracking-tight"
                    />
                </div>

                {/* Status Filter Matrix */}
                <div className="flex items-center p-1 bg-white dark:bg-neutral-900 rounded-2xl border border-default dark:border-neutral-800 shadow-sm w-full md:w-auto overflow-hidden text-nowrap">
                    {['ALL', 'PENDING', 'RECEIVED', 'VERIFIED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => onStatusChange(status)}
                            className={`flex-1 md:flex-none px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${statusFilter === status
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                }`}
                        >
                            {status === 'ALL' ? 'Universal' : status}
                        </button>
                    ))}
                </div>

                <div className="hidden lg:flex px-6 py-3.5 bg-emerald-500/10 rounded-full border border-emerald-500/10 items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Sync Active</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onClear}
                    className="p-3.5 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-emerald-600 hover:scale-110 active:scale-95 border border-default dark:border-neutral-800 rounded-2xl transition-all shadow-sm group"
                    title="Reset Matrix"
                >
                    <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
                </button>
                
                <div className="px-5 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-2xl flex items-center gap-3 shadow-md hover:scale-[1.02] transition-transform cursor-pointer group">
                    <Zap className="w-4 h-4 group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] italic leading-none whitespace-nowrap">Rapid Actions</span>
                </div>
            </div>
        </div>
    );
};

export default GRNFilters;
