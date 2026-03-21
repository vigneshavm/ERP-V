import React from 'react';
import { Search, Bot } from 'lucide-react';
import { useStorefrontLogic } from "../useStorefrontLogic";
import { StorefrontHeader } from "./StorefrontHeader";
import { StorefrontFilters } from "./StorefrontFilters";
import { StorefrontAiPanel } from "./StorefrontAiPanel";
import { StorefrontProductDisplay } from "./StorefrontProductDisplay";

const Storefront: React.FC = () => {
    const {
        viewMode, setViewMode,
        showMobileFilters, setShowMobileFilters,
        showAi, setShowAi,
        searchTerm, setSearchTerm,
        aiQuery, setAiQuery,
        aiThinking,
        aiResult,
        visualSearchImage,
        isVisualSearching,
        fileInputRef,
        priceRange, setPriceRange,
        selectedCategories,
        sortBy, setSortBy,
        inStockOnly, setInStockOnly,
        availableCategories,
        filteredProducts,
        handleAiSearch,
        handleVisualSearch,
        clearAi,
        toggleCategory,
        resetFilters,
        addToCartHandler
    } = useStorefrontLogic();

    return (
        <div className="flex flex-col h-full bg-[var(--erp-bg-sunken)] dark:bg-slate-950 animate-fade-in relative">
            <StorefrontHeader
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                showAi={showAi}
                setShowAi={setShowAi}
                setShowMobileFilters={setShowMobileFilters}
                fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                handleVisualSearch={handleVisualSearch}
            />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Desktop Sidebar */}
                <div className="hidden md:block">
                    <StorefrontFilters
                        availableCategories={availableCategories}
                        selectedCategories={selectedCategories}
                        toggleCategory={toggleCategory}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        inStockOnly={inStockOnly}
                        setInStockOnly={setInStockOnly}
                        resetFilters={resetFilters}
                    />
                </div>

                {/* Mobile Sidebar Overlay */}
                {showMobileFilters && (
                    <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
                        <div className="w-4/5 h-full animate-slide-in-right">
                            <StorefrontFilters
                                availableCategories={availableCategories}
                                selectedCategories={selectedCategories}
                                toggleCategory={toggleCategory}
                                priceRange={priceRange}
                                setPriceRange={setPriceRange}
                                inStockOnly={inStockOnly}
                                setInStockOnly={setInStockOnly}
                                resetFilters={resetFilters}
                                isMobile
                                onClose={() => setShowMobileFilters(false)}
                            />
                        </div>
                    </div>
                )}

                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <StorefrontAiPanel
                        showAi={showAi}
                        setShowAi={setShowAi}
                        aiQuery={aiQuery}
                        setAiQuery={setAiQuery}
                        aiThinking={aiThinking}
                        aiResult={aiResult}
                        visualSearchImage={visualSearchImage}
                        isVisualSearching={isVisualSearching}
                        handleAiSearch={handleAiSearch}
                        clearAi={clearAi}
                    />

                    <StorefrontProductDisplay
                        filteredProducts={filteredProducts}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        onAddToCart={addToCartHandler}
                    />

                    {/* Empty State */}
                    {filteredProducts.length === 0 && (
                        <div className="py-20 text-center text-muted dark:text-muted">
                            {aiResult ? (
                                <>
                                    <Bot className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-lg">AI couldn't find exact matches for your request.</p>
                                    <button onClick={clearAi} className="mt-4 text-indigo-600 font-bold hover:underline">Clear Search</button>
                                </>
                            ) : (
                                <>
                                    <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-lg">No products found matching your filters.</p>
                                    <button onClick={resetFilters} className="mt-4 text-indigo-600 font-bold hover:underline">Clear Filters</button>
                                </>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Storefront;
