import React from 'react';
import { Search } from 'lucide-react';

interface VendorSearchProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
}

const VendorSearch: React.FC<VendorSearchProps> = ({ searchTerm, onSearchChange }) => {
    return (
        <div className="flex gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search vendors by name, phone, or GSTIN..."
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>
        </div>
    );
};

export default VendorSearch;
