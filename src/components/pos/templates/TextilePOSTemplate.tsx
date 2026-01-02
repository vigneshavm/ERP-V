import React from 'react';
import { ShoppingCart, LayoutGrid, Table as TableIcon, PauseCircle, Monitor, Scissors } from 'lucide-react';
import { POSLogic } from '../../../hooks/usePOSLogic';
import { POSHeader } from '../POSHeader';
import { POSSidebar } from '../POSSidebar';
import { POSProductBrowser } from '../POSProductBrowser';
import { POSCartGrid } from '../POSCartGrid';
import { POSCustomerPanel } from '../POSCustomerPanel';
import { POSFooter } from '../POSFooter';
import { POSHeldBillsModal } from '../POSHeldBillsModal';
import { POSTerminalInfo } from '../POSTerminalInfo';
import { POSCategoryBrowserModal } from '../POSCategoryBrowserModal';

interface POSTemplateProps {
    logic: POSLogic;
}

/**
 * TextilePOSTemplate
 * 
 * A specialized UI for the Textile sector.
 * Features:
 * - Domain branding (Scissors icon/Badge)
 * - Highlights "Cut Length" (implicit in components, but could be explicit here)
 * - Different layout emphasizes the cart grid
 */
export const TextilePOSTemplate: React.FC<POSTemplateProps> = ({ logic }) => {
    const {
        sessions,
        activeSessionIndex,
        activeSession,
        cart,
        activeCustomer,
        customers,
        heldBills,
        isFullScreen,
        viewMode,
        mobileTab,
        isProcessing,
        isPreOrder,
        isHeldBillsOpen,
        cartSubtotal,
        taxAmount,
        cartTotal,
        redemptionAmount,
        finalTotal,
        hasMultipleBranches,
        products,
        loyaltyConfig,
        currentBranch,
        activeCounterId,
        onAddToCart,
        onRemoveFromCart,
        onUpdateCartQty,
        onUpdateCartLength,
        onSetCustomer,
        onLookupOrCreateCustomer,
        onSetTaxMode,
        onSetPaymentMethod,
        onSetRedeemedPoints,
        onSetActiveCounter,
        toggleFullScreen,
        setViewMode,
        setMobileTab,
        setIsPreOrder,
        setIsHeldBillsOpen,
        handleCheckout,
        switchSession,
        addSession,
        removeSession,
        resumeBill,
        discardHeldBill,
        posContainerRef,
        user,
        activeCounterName,
        currentSector,
        branches,
        isCategoryBrowserOpen,
        setIsCategoryBrowserOpen,
        categories,
        getSubcategories,
        allProductTypes
    } = logic;

    return (
        <div
            ref={posContainerRef}
            className={`flex flex-col relative transition-all duration-300 ${isFullScreen ? 'h-screen fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 p-4 pb-20 lg:pb-4' : 'h-[calc(100vh-4rem)] pb-20 lg:pb-0'}`}
        >
            {/* Sector Specific Badge */}
            <div className="absolute top-2 right-4 z-50 pointer-events-none opacity-20">
                <div className="flex items-center gap-2 text-indigo-600 font-black tracking-tighter text-xl">
                    <Scissors className="w-6 h-6 rotate-45" /> TEXTILE EDITION
                </div>
            </div>

            <POSHeldBillsModal
                isOpen={isHeldBillsOpen}
                onClose={() => setIsHeldBillsOpen(false)}
                heldBills={heldBills || []}
                onResume={resumeBill}
                onDiscard={discardHeldBill}
            />

            <POSCategoryBrowserModal
                isOpen={isCategoryBrowserOpen}
                onClose={() => setIsCategoryBrowserOpen(false)}
                products={products}
                categories={categories}
                getSubcategories={getSubcategories}
                onAddToCart={onAddToCart}
            />

            {/* Header */}
            <div className="flex flex-col gap-2 mb-2">
                <div className="flex justify-between items-center gap-2">
                    <POSHeader
                        sessions={sessions}
                        activeSessionIndex={activeSessionIndex}
                        onSwitchSession={switchSession}
                        onAddSession={addSession}
                        onRemoveSession={removeSession}
                        isFullScreen={isFullScreen}
                        onToggleFullScreen={toggleFullScreen}
                        activeCounterId={activeCounterId}
                        onSwitchCounter={onSetActiveCounter}
                        branches={branches}
                        currentBranch={currentBranch}
                    />
                    <div className="flex gap-2 mr-2">
                        <button
                            onClick={() => setIsHeldBillsOpen(true)}
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg flex items-center gap-2"
                        >
                            <PauseCircle className="w-5 h-5" />
                        </button>

                        <div className="bg-slate-100 p-1 rounded-lg flex gap-1 ml-2">
                            <button
                                onClick={() => setViewMode('SCANNER')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'SCANNER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                <TableIcon className="w-3.5 h-3.5 inline mr-1" /> Scanner
                            </button>
                            <button
                                onClick={() => setViewMode('VISUAL')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'VISUAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5 inline mr-1" /> Visual
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                {/* Main View Area */}
                <div className={`col-span-12 lg:col-span-8 flex flex-col min-h-0 ${mobileTab === 'MAIN' ? 'flex' : 'hidden lg:flex'}`}>
                    {viewMode === 'VISUAL' ? (
                        <POSProductBrowser
                            products={products}
                            currentBranch={currentBranch}
                            currentSector={currentSector}
                            onAddToCart={onAddToCart}
                        />
                    ) : (
                        <POSCartGrid
                            cart={cart}
                            products={products}
                            currentSector={currentSector}
                            currentBranch={currentBranch}
                            isProcessing={isProcessing}
                            onAddToCart={onAddToCart}
                            onRemoveFromCart={onRemoveFromCart}
                            onUpdateCartQty={onUpdateCartQty}
                            onUpdateCartLength={onUpdateCartLength}
                            onOpenCategoryBrowser={() => setIsCategoryBrowserOpen(true)}
                            allProductTypes={allProductTypes}
                        />
                    )}
                </div>

                {/* Sidebar Area */}
                <div className={`col-span-12 lg:col-span-4 flex flex-col min-h-0 border-l border-slate-200 dark:border-slate-800 ${mobileTab === 'CART' ? 'flex' : 'hidden lg:flex'}`}>
                    <div className="flex overflow-hidden flex-col h-full">
                        <POSTerminalInfo
                            cashierName={user?.name}
                            counterName={activeCounterName}
                            counterId={activeCounterId}
                        />
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                            <POSCustomerPanel
                                activeCustomer={activeCustomer}
                                customers={customers}
                                onSetCustomer={onSetCustomer}
                                onLookupOrCreateCustomer={onLookupOrCreateCustomer}
                            />
                        </div>

                        <div className="flex-1" />

                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
                            <POSFooter
                                cartSubtotal={cartSubtotal}
                                taxAmount={taxAmount}
                                cartTotal={cartTotal}
                                redemptionAmount={redemptionAmount}
                                finalTotal={finalTotal}
                                taxMode={activeSession.taxMode}
                                paymentMethod={activeSession.paymentMethod}
                                isProcessing={isProcessing}
                                isBranchAll={currentBranch === 'All'}
                                hasMultipleBranches={hasMultipleBranches}
                                isEmpty={cart.length === 0}
                                isPreOrder={isPreOrder}
                                activeCustomer={activeCustomer}
                                loyaltyConfig={loyaltyConfig}
                                onSetTaxMode={onSetTaxMode}
                                onSetPaymentMethod={onSetPaymentMethod}
                                onSetRedeemedPoints={onSetRedeemedPoints}
                                onSetIsPreOrder={setIsPreOrder}
                                onCheckout={handleCheckout}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around">
                <button onClick={() => setMobileTab('MAIN')} className={`px-4 py-2 rounded ${mobileTab === 'MAIN' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>View</button>
                <button onClick={() => setMobileTab('CART')} className={`px-4 py-2 rounded ${mobileTab === 'CART' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}>Cart</button>
            </div>
        </div>
    );
};
