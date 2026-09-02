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
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-4">
            <div className="flex-1 max-w-2xl relative flex items-center">
                <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3" />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-2 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"
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
                    className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all border ${showAi ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-primary dark:text-primary border-indigo-200 dark:border-indigo-900'}`}
                >
                    <Sparkles className="w-4 h-4" />
                    <span>AI Assistant</span>
                </button>

                <button
                    onClick={() => setShowMobileFilters(true)}
                    className="md:hidden p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                    <SlidersHorizontal className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </button>
            </div>
        </div>
    );
};
