import React from 'react';
import { Search } from 'lucide-react';

interface Props {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
}

const BillsFilters: React.FC<Props> = ({ searchTerm, onSearchChange, statusFilter, onStatusFilterChange }) => {
    return (
        <div className="bg-white dark:bg-[rgb(var(--color-card))] border dark:border-[rgb(var(--color-border))] rounded-sm p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="w-full sm:w-96 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search bill # or supplier..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    className="px-4 py-2.5 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl text-sm"
                >
                    <option value="all">All Status</option>
                    <option value="Received">Received</option>
                    <option value="Matched">Matched</option>
                    <option value="Approved">Approved</option>
                    <option value="Paid">Paid</option>
                    <option value="Disputed">Disputed</option>
                    <option value="Hold">On Hold</option>
                </select>
            </div>
        </div>
    );
};

export default BillsFilters;
