import React from 'react';
import { ShoppingCart, LayoutGrid, Table as TableIcon, PauseCircle, Monitor, Scissors, Printer, Download } from 'lucide-react';
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
        isReturnMode,
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
        setIsReturnMode,
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
        allProductTypes,
        lastBill,
        reprintLastBill,
        downloadLastBill
    } = logic;

    return (
        <div
            ref={posContainerRef}
            className={`flex flex-col relative transition-all duration-300 ${isFullScreen ? 'h-screen fixed inset-0 z-50 bg-neutral-50 dark:bg-neutral-950 p-4 pb-20 lg:pb-4' : 'h-[calc(100vh-4rem)] pb-20 lg:pb-0'}`}
        >
            {/* Sector Specific Badge */}
            <div className="absolute top-2 right-4 z-50 pointer-events-none opacity-20">
                <div className="flex items-center gap-2 text-primary font-black tracking-tighter text-xl">
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
                            className="p-2 bg-primary/10 text-primary rounded-lg flex items-center gap-2"
                        >
                            <PauseCircle className="w-5 h-5" />
                        </button>

                        <div className="bg-neutral-100 p-1 rounded-lg flex gap-1 ml-2">
                            {/* Sale / Return Toggle */}
                            <div className="flex bg-gray-200 p-0.5 rounded-lg mr-2">
                                <button
                                    onClick={() => setIsReturnMode(false)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${!isReturnMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Sale
                                </button>
                                <button
                                    onClick={() => setIsReturnMode(true)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${isReturnMode ? 'bg-red-50 text-red-600 shadow-sm ring-1 ring-red-100' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Return
                                </button>
                            </div>

                            <button
                                onClick={() => setViewMode('SCANNER')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'SCANNER' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500'}`}
                            >
                                <TableIcon className="w-3.5 h-3.5 inline mr-1" /> Scanner
                            </button>
                            <button
                                onClick={() => setViewMode('VISUAL')}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === 'VISUAL' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500'}`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5 inline mr-1" /> Visual
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
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
                <div className={`col-span-12 lg:col-span-4 flex flex-col min-h-0 border-l border-neutral-200 dark:border-neutral-800 ${mobileTab === 'CART' ? 'flex' : 'hidden lg:flex'}`}>
                    <div className="flex overflow-hidden flex-col h-full">
                        <POSTerminalInfo
                            cashierName={user?.name}
                            counterName={activeCounterName}
                            counterId={activeCounterId}
                        />
                        <div className="p-2 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                            <POSCustomerPanel
                                activeCustomer={activeCustomer}
                                customers={customers}
                                onSetCustomer={onSetCustomer}
                                onLookupOrCreateCustomer={onLookupOrCreateCustomer}
                            />
                        </div>


                        {/* Last Bill Card */}
                        {lastBill && (
                            <div className="px-2 pb-1">
                                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 shadow-sm">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Last Bill</span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={downloadLastBill}
                                                className="text-neutral-400 hover:text-primary p-0.5 transition-colors"
                                                title="Download PDF"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={reprintLastBill}
                                                className="text-neutral-400 hover:text-primary p-0.5 transition-colors"
                                                title="Reprint Last Bill"
                                            >
                                                <Printer className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center pb-0.5">
                                        <span className="text-xl font-black text-primary tracking-tight leading-none mb-1">
                                            ₹{lastBill.total.toFixed(2)}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 leading-none">
                                            <span className="font-medium text-neutral-600 dark:text-neutral-300">#{lastBill.id.split('-').pop()}</span>
                                            <div className="w-0.5 h-0.5 rounded-full bg-neutral-300" />
                                            <span>{new Date(lastBill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-2 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-800">
                            <POSFooter
                                cartSubtotal={cartSubtotal}
                                taxAmount={taxAmount}
                                cartTotal={cartTotal}
                                redemptionAmount={redemptionAmount}
                                finalTotal={finalTotal}
                                isRefund={finalTotal < 0}
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
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-2 flex justify-around">
                <button onClick={() => setMobileTab('MAIN')} className={`px-4 py-2 rounded ${mobileTab === 'MAIN' ? 'bg-primary text-white' : 'bg-neutral-100'}`}>View</button>
                <button onClick={() => setMobileTab('CART')} className={`px-4 py-2 rounded ${mobileTab === 'CART' ? 'bg-primary text-white' : 'bg-neutral-100'}`}>Cart</button>
            </div>
        </div>
    );
};
export default TextilePOSTemplate;
