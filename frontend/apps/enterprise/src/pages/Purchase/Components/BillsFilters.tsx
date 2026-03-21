import React from 'react';
import { Search, Filter, Database, Zap } from 'lucide-react';

interface Props {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
}

const BillsFilters: React.FC<Props> = ({ searchTerm, onSearchChange, statusFilter, onStatusFilterChange }) => {
    return (
        <div className="p-4 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[2.5rem] flex flex-col lg:flex-row gap-6 items-center justify-between border border-default dark:border-neutral-800">
            <div className="relative w-full lg:max-w-xl group/search">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-400 group-focus-within/search:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Intercept Bill # or Supplier Entity..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="block w-full pl-14 pr-6 py-4 bg-white dark:bg-neutral-900 border-none rounded-[1.5rem] text-sm font-bold placeholder:text-neutral-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm italic uppercase tracking-tight"
                />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-default dark:border-neutral-800 flex-1 lg:flex-none">
                    <Filter className="w-4 h-4 text-neutral-400 ml-3" />
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusFilterChange(e.target.value)}
                        className="px-4 py-2 bg-transparent border-none text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-400 focus:ring-0 outline-none cursor-pointer"
                    >
                        <option value="all">Global Status</option>
                        <option value="Received">Received</option>
                        <option value="Matched">Matched</option>
                        <option value="Approved">Approved</option>
                        <option value="Paid">Paid</option>
                        <option value="Disputed">Disputed</option>
                        <option value="Hold">On Hold</option>
                    </select>
                </div>
                
                <div className="px-6 py-3 bg-blue-500/10 rounded-full border border-blue-500/10 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600">Active Pipeline</span>
                </div>
            </div>
        </div>
    );
};

export default BillsFilters;
