import React from 'react';
import { Search, RefreshCcw, Filter, Zap, Database } from 'lucide-react';

interface SupplierFilterBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    placeholder?: string;

    // Status Filtering
    showStatusFilter?: boolean;
    filterStatus?: 'all' | 'overdue' | 'due_week' | string;
    onFilterChange?: (status: any) => void;

    // Refresh
    onRefresh: () => void;
    isLoading?: boolean;

    // Children for extra actions (like DatePicker)
    children?: React.ReactNode;
}

const SupplierFilterBar: React.FC<SupplierFilterBarProps> = ({
    searchTerm,
    onSearchChange,
    placeholder = "Search suppliers...",
    showStatusFilter = false,
    filterStatus = 'all',
    onFilterChange,
    onRefresh,
    isLoading = false,
    children
}) => {
    return (
        <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[2.5rem] flex flex-col lg:flex-row gap-6 items-center justify-between border border-default dark:border-neutral-800">
            <div className="flex flex-col md:flex-row items-center gap-4 w-full lg:w-auto">
                {/* Search */}
                <div className="relative w-full md:w-80 group/search">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-neutral-400 group-focus-within/search:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3.5 bg-white dark:bg-neutral-900 border-none rounded-2xl text-xs font-bold placeholder:text-neutral-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm italic uppercase tracking-tight"
                    />
                </div>

                {/* Status Filter Matrix */}
                {showStatusFilter && onFilterChange && (
                    <div className="flex items-center p-1 bg-white dark:bg-neutral-900 rounded-2xl border border-default dark:border-neutral-800 shadow-sm w-full md:w-auto overflow-hidden">
                        {['all', 'overdue', 'due_week'].map((status) => (
                            <button
                                key={status}
                                onClick={() => onFilterChange(status)}
                                className={`flex-1 md:flex-none px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filterStatus === status
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                    }`}
                            >
                                {status === 'all' ? 'Universal' : status === 'overdue' ? 'Tardy' : 'Imminent'}
                            </button>
                        ))}
                    </div>
                )}

                {children}

                <div className="hidden lg:flex px-6 py-3.5 bg-blue-500/10 rounded-full border border-blue-500/10 items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Sync Active</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onRefresh}
                    className="p-3.5 bg-white dark:bg-neutral-900 text-neutral-500 hover:text-blue-600 hover:scale-110 active:scale-95 border border-default dark:border-neutral-800 rounded-2xl transition-all shadow-sm group"
                    title="Refresh Matrix"
                >
                    <RefreshCcw className={`w-5 h-5 ${isLoading ? 'animate-spin text-blue-500' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                </button>
                
                <div className="px-5 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-2xl flex items-center gap-3 shadow-md hover:scale-[1.02] transition-transform cursor-pointer group">
                    <Zap className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] italic leading-none whitespace-nowrap">Rapid Actions</span>
                </div>
            </div>
        </div>
    );
};

export default SupplierFilterBar;
