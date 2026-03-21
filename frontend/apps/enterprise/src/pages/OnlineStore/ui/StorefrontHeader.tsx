import React from 'react';
import { Search, ImageIcon, Sparkles, SlidersHorizontal } from 'lucide-react';

interface StorefrontHeaderProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    showAi: boolean;
    setShowAi: (val: boolean) => void;
    setShowMobileFilters: (val: boolean) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleVisualSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const StorefrontHeader: React.FC<StorefrontHeaderProps> = ({
    searchTerm,
    setSearchTerm,
    showAi,
    setShowAi,
    setShowMobileFilters,
    fileInputRef,
    handleVisualSearch
}) => {
    return (
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-[var(--erp-bg)]/80 backdrop-blur-md border-b border-default dark:border-default px-4 py-3 flex items-center gap-4">
            <div className="flex-1 max-w-2xl relative flex items-center">
                <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] border-none rounded-xl text-main outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                />
                <Search className="w-5 h-5 text-muted absolute left-3" />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-2 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-muted transition-colors"
                    title="Search by Image"
                >
                    <ImageIcon className="w-5 h-5" />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleVisualSearch}
                />
            </div>

            <div className="flex items-center gap-2 ml-auto">
                <button
                    onClick={() => setShowAi(!showAi)}
                    className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border ${showAi ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-[var(--erp-card)] text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900'}`}
                >
                    <Sparkles className="w-4 h-4" />
                    <span>AI Assistant</span>
                </button>

                <button
                    onClick={() => setShowMobileFilters(true)}
                    className="md:hidden p-2.5 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-xl"
                >
                    <SlidersHorizontal className="w-5 h-5 text-secondary dark:text-muted" />
                </button>
            </div>
        </div>
    );
};
