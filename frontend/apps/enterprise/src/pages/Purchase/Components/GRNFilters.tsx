import React from 'react';
import { Search, Calendar } from 'lucide-react';

interface GRNFiltersProps {
    searchTerm: string;
    statusFilter: string;
    dateFrom: string;
    dateTo: string;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onClear: () => void;
}

const GRNFilters: React.FC<GRNFiltersProps> = ({
    searchTerm,
    statusFilter,
    dateFrom,
    dateTo,
    onSearchChange,
    onStatusChange,
    onDateFromChange,
    onDateToChange,
    onClear
}) => {
    return (
        <div className="bg-white dark:bg-[var(--erp-card)] p-4 rounded-xl border border-default dark:border-default flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-secondary font-bold uppercase mb-1 block">Search</label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="GRN #, PO #, or Vendor..."
                        className="w-full pl-9 pr-4 py-2 bg-[var(--erp-bg-sunken)] dark:bg-neutral-700 border border-default dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-main text-sm"
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                    />
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                </div>
            </div>

            <div>
                <label className="text-xs text-secondary font-bold uppercase mb-1 block">From Date</label>
                <div className="relative">
                    <input
                        type="date"
                        className="pl-9 pr-4 py-2 bg-[var(--erp-bg-sunken)] dark:bg-neutral-700 border border-default dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-main text-sm"
                        value={dateFrom}
                        onChange={e => onDateFromChange(e.target.value)}
                    />
                    <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                </div>
            </div>

            <div>
                <label className="text-xs text-secondary font-bold uppercase mb-1 block">To Date</label>
                <div className="relative">
                    <input
                        type="date"
                        className="pl-9 pr-4 py-2 bg-[var(--erp-bg-sunken)] dark:bg-neutral-700 border border-default dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-main text-sm"
                        value={dateTo}
                        onChange={e => onDateToChange(e.target.value)}
                    />
                    <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                </div>
            </div>

            <div>
                <label className="text-xs text-secondary font-bold uppercase mb-1 block">Status</label>
                <select
                    className="px-4 py-2 bg-[var(--erp-bg-sunken)] dark:bg-neutral-700 border border-default dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-main text-sm"
                    value={statusFilter}
                    onChange={e => onStatusChange(e.target.value)}
                >
                    <option value="ALL">All Status</option>
                    <option value="COMPLETE">Complete</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="PENDING">Pending</option>
                </select>
            </div>

            <button
                onClick={onClear}
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-bold"
            >
                Clear
            </button>
        </div>
    );
};

export default GRNFilters;
