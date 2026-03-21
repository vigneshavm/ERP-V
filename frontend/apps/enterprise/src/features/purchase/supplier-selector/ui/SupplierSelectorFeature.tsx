import React, { useRef, useEffect } from 'react';
import { Search, User, X, Check, Loader2, ChevronsUpDown } from 'lucide-react';
import { useSupplierSearch } from '../model/useSupplierSearch';
import { Supplier } from "@vignesh-erp/shared-kernel";

interface SupplierSelectorFeatureProps {
    onSelect: (supplier: Supplier | null) => void;
    initialId?: string;
    className?: string;
}

const SupplierSelectorFeature: React.FC<SupplierSelectorFeatureProps> = ({ 
    onSelect, 
    initialId = '', 
    className = '' 
}) => {
    const {
        searchQuery,
        setSearchQuery,
        filteredSuppliers,
        selectedSupplier,
        showDropdown,
        setShowDropdown,
        handleSelect,
        handleClear
    } = useSupplierSearch(initialId);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle initial selection callback
    useEffect(() => {
        if (selectedSupplier) {
            onSelect(selectedSupplier);
        }
    }, [selectedSupplier, onSelect]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setShowDropdown]);

    return (
        <div className={`relative w-full ${className}`} ref={dropdownRef}>
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-2 px-1">
                Strategic Partner / Supplier
            </label>
            
            <div 
                className={`
                    group relative flex items-center gap-3 px-4 py-3.5
                    bg-white/50 dark:bg-[var(--erp-bg)]/50 backdrop-blur-xl
                    border-2 transition-all duration-500 rounded-2xl
                    ${showDropdown ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-2xl' : 'border-slate-100 dark:border-default hover:border-slate-300 dark:hover:border-default shadow-sm'}
                    cursor-pointer
                `}
                onClick={() => setShowDropdown(!showDropdown)}
            >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] flex items-center justify-center text-muted group-hover:text-indigo-500 transition-colors">
                    <User className="w-5 h-5" />
                </div>

                <div className="flex-grow min-w-0">
                    {selectedSupplier ? (
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-main dark:text-main truncate">
                                {selectedSupplier.businessName}
                            </span>
                            <span className="text-[10px] font-bold text-muted uppercase tracking-tight">
                                {selectedSupplier.supplierId} • {selectedSupplier.contactNo}
                            </span>
                        </div>
                    ) : (
                        <span className="text-sm font-bold text-muted">Select a strategic supplier...</span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {selectedSupplier && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                                onSelect(null);
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-500 text-slate-300 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <ChevronsUpDown className={`w-4 h-4 text-muted transition-transform duration-500 ${showDropdown ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-3 p-2 bg-white/90 dark:bg-[var(--erp-bg)]/95 backdrop-blur-2xl border-2 border-slate-100 dark:border-default rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Search by name, ID or contact..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
                        {filteredSuppliers.length > 0 ? (
                            filteredSuppliers.map((supplier) => (
                                <button
                                    key={supplier._id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelect(supplier);
                                        onSelect(supplier);
                                    }}
                                    className={`
                                        w-full flex items-center justify-between p-3 rounded-xl transition-all
                                        ${selectedSupplier?._id === supplier._id 
                                            ? 'bg-indigo-500/10 text-indigo-500' 
                                            : 'hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-card)] text-secondary dark:text-muted hover:text-main dark:hover:text-white'}
                                    `}
                                >
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-sm font-black">{supplier.businessName}</span>
                                        <span className="text-[10px] font-bold opacity-60 uppercase tracking-tight">
                                            {supplier.supplierId} • {supplier.contactNo}
                                        </span>
                                    </div>
                                    {selectedSupplier?._id === supplier._id && (
                                        <div className="w-6 h-6 rounded-full bg-indigo-500 text-main flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <Search className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                <p className="text-xs font-bold text-muted uppercase tracking-widest">No partners found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierSelectorFeature;
