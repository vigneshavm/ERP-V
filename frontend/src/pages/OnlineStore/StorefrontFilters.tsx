import React from 'react';
import { Filter, Check } from 'lucide-react';

interface StorefrontFiltersProps {
    availableCategories: string[];
    selectedCategories: string[];
    toggleCategory: (cat: string) => void;
    priceRange: { min: string, max: string };
    setPriceRange: (val: { min: string, max: string }) => void;
    inStockOnly: boolean;
    setInStockOnly: (val: boolean) => void;
    resetFilters: () => void;
    isMobile?: boolean;
    onClose?: () => void;
}

export const StorefrontFilters: React.FC<StorefrontFiltersProps> = ({
    availableCategories,
    selectedCategories,
    toggleCategory,
    priceRange,
    setPriceRange,
    inStockOnly,
    setInStockOnly,
    resetFilters,
    isMobile,
    onClose
}) => {
    return (
        <aside className={`${isMobile ? 'w-full' : 'w-64'} bg-white dark:bg-slate-900 ${!isMobile ? 'border-r' : ''} border-slate-200 dark:border-slate-800 overflow-y-auto p-5`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-lg">
                    <Filter className="w-5 h-5" /> Filters
                </div>
                {isMobile && onClose && (
                    <button onClick={onClose} className="text-slate-500 font-bold">Close</button>
                )}
            </div>

            <div className="mb-8">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Categories</h4>
                <div className="space-y-2">
                    {availableCategories.map(cat => (
                        <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCategories.includes(cat) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                                {selectedCategories.includes(cat) && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" onChange={() => toggleCategory(cat)} checked={selectedCategories.includes(cat)} />
                            <span className={`text-sm ${selectedCategories.includes(cat) ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400'}`}>{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="mb-8">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Price Range</h4>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        placeholder="Min"
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={priceRange.min}
                        onChange={e => setPriceRange({ ...priceRange, min: e.target.value })}
                    />
                    <span className="text-slate-400">-</span>
                    <input
                        type="number"
                        placeholder="Max"
                        className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={priceRange.max}
                        onChange={e => setPriceRange({ ...priceRange, max: e.target.value })}
                    />
                </div>
            </div>

            <div className="mb-8">
                <label className="flex items-center gap-3 cursor-pointer">
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${inStockOnly ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${inStockOnly ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <input type="checkbox" className="hidden" checked={inStockOnly} onChange={() => setInStockOnly(!inStockOnly)} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">In Stock Only</span>
                </label>
            </div>

            <button
                onClick={resetFilters}
                className="w-full py-2 text-sm text-slate-500 hover:text-red-500 font-medium transition-colors border border-dashed border-slate-300 dark:border-slate-700 rounded-lg hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/10"
            >
                Reset Filters
            </button>
        </aside>
    );
};
