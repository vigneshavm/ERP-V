import React from 'react';
import { Search, RefreshCcw } from 'lucide-react';

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-64 pl-9 pr-4 py-2 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all text-sm text-slate-700 dark:text-neutral-200 placeholder:text-slate-400"
                    />
                </div>

                {/* Status Filter */}
                {showStatusFilter && onFilterChange && (
                    <div className="flex items-center bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                        {['all', 'overdue', 'due_week'].map((status) => (
                            <button
                                key={status}
                                onClick={() => onFilterChange(status)}
                                className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${filterStatus === status
                                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-700'
                                    }`}
                            >
                                {status === 'all' ? 'All' : status === 'overdue' ? 'Overdue' : 'Due Soon'}
                            </button>
                        ))}
                    </div>
                )}

                {children}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onRefresh}
                    className={`p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-neutral-700 rounded-lg transition-all ${isLoading ? 'animate-spin' : ''}`}
                    title="Refresh"
                >
                    <RefreshCcw className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default SupplierFilterBar;
