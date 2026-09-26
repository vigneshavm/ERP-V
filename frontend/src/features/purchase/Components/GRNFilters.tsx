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
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-secondary font-bold uppercase mb-1 block">Search</label>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="GRN #, PO #, or Vendor..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                        value={searchTerm}
                        onChange={e => onSearchChange(e.target.value)}
                    />
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                </div>
            </div>

            <div>
                <label className="text-xs text-secondary font-bold uppercase mb-1 block">From Date</label>
                <div className="relative">
                    <input
                        type="date"
                        className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                        value={dateFrom}
                        onChange={e => onDateFromChange(e.target.value)}
                    />
                    <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                </div>
            </div>

            <div>
                <label className="text-xs text-secondary font-bold uppercase mb-1 block">To Date</label>
                <div className="relative">
                    <input
                        type="date"
                        className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
                        value={dateTo}
                        onChange={e => onDateToChange(e.target.value)}
                    />
                    <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                </div>
            </div>

            <div>
                <label className="text-xs text-secondary font-bold uppercase mb-1 block">Status</label>
                <select
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-sm"
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
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold"
            >
                Clear
            </button>
        </div>
    );
};

export default GRNFilters;
