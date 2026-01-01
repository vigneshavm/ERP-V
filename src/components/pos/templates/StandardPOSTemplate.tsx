import React from 'react';
import { ShoppingCart, LayoutGrid, Table as TableIcon, PauseCircle, Monitor } from 'lucide-react';
import { POSLogic } from '../../../hooks/usePOSLogic';
import { POSHeader } from '../POSHeader';
import { POSSidebar } from '../POSSidebar';
import { POSProductBrowser } from '../POSProductBrowser';
import { POSCartGrid } from '../POSCartGrid';
import { POSCustomerPanel } from '../POSCustomerPanel';
import { POSFooter } from '../POSFooter';
import { POSHeldBillsModal } from '../POSHeldBillsModal';

interface POSTemplateProps {
    logic: POSLogic;
}

export const StandardPOSTemplate: React.FC<POSTemplateProps> = ({ logic }) => {
    const {
        user,
        currentSector,
        currentBranch,
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
        hasMultipleBranches,
        products,
        toggleFullScreen,
        setViewMode,
        setMobileTab,
        setIsPreOrder,
        setIsHeldBillsOpen,
        handleCheckout,
        switchSession,
        resumeBill,
        discardHeldBill,
        dispatch,
        posContainerRef
    } = logic;

    return (
        <div
            ref={posContainerRef}
            className={`flex flex-col relative transition-all duration-300 ${isFullScreen ? 'h-screen fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 p-4 pb-20 lg:pb-4' : 'h-[calc(100vh-4rem)] pb-20 lg:pb-0'}`}
        >
            {/* Modals */}
            <POSHeldBillsModal
                isOpen={isHeldBillsOpen}
                onClose={() => setIsHeldBillsOpen(false)}
                heldBills={heldBills || []}
                onResume={resumeBill}
                onDiscard={discardHeldBill}
            />

            {/* Header with View Toggle */}
            <div className="flex flex-col gap-2 mb-2">
                <div className="flex justify-between items-center gap-2">
                    <POSHeader
                        sessions={sessions}
                        activeSessionIndex={activeSessionIndex}
                        onSwitchSession={switchSession}
                        isFullScreen={isFullScreen}
                        onToggleFullScreen={toggleFullScreen}
                    />
                    <div className="flex gap-2 mr-2">
                        <button
                            onClick={() => setIsHeldBillsOpen(true)}
                            className="relative p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg flex items-center gap-2 transition-colors group"
                            title="Held Bills (F6)"
                        >
                            <PauseCircle className="w-5 h-5" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="hidden md:inline font-bold text-sm">Held Bills</span>
                                <kbd className="text-[9px] opacity-50 font-mono tracking-tighter">F6</kbd>
                            </div>
                            {(heldBills?.length || 0) > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">
                                    {heldBills?.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => window.open(window.location.origin + '?mode=customer_display', 'CustomerDisplay', 'width=800,height=600,menubar=0,toolbar=0')}
                            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg flex items-center gap-2 transition-colors"
                            title="Customer Display"
                        >
                            <Monitor className="w-5 h-5" />
                        </button>

                        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex gap-1 ml-2">
                            <button
                                onClick={() => setViewMode('SCANNER')}
                                className={`px-3 py-1 bg-white dark:bg-slate-700 rounded-md text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${viewMode === 'SCANNER' ? 'text-indigo-600 dark:text-indigo-400 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <TableIcon className="w-3.5 h-3.5" /> Scanner
                                </div>
                                <kbd className="text-[9px] opacity-40 font-mono tracking-tighter">Alt+V</kbd>
                            </button>
                            <button
                                onClick={() => setViewMode('VISUAL')}
                                className={`px-3 py-1 bg-white dark:bg-slate-800 rounded-md text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${viewMode === 'VISUAL' ? 'text-indigo-600 dark:text-indigo-400 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <LayoutGrid className="w-3.5 h-3.5" /> Visual
                                </div>
                                <kbd className="text-[9px] opacity-40 font-mono tracking-tighter">Alt+V</kbd>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 bg-slate-100 dark:bg-slate-900/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className={`col-span-12 lg:col-span-8 flex flex-col min-h-0 ${mobileTab === 'MAIN' ? 'flex' : 'hidden lg:flex'}`}>
                    {viewMode === 'VISUAL' ? (
                        <POSProductBrowser
                            products={products}
                            currentBranch={currentBranch}
                            currentSector={currentSector}
                        />
                    ) : (
                        <POSCartGrid
                            cart={cart}
                            products={products}
                            currentSector={currentSector}
                            currentBranch={currentBranch}
                            dispatch={dispatch}
                            isProcessing={isProcessing}
                        />
                    )}
                </div>

                <div className={`col-span-12 lg:col-span-4 flex flex-col min-h-0 border-l border-slate-200 dark:border-slate-800 ${mobileTab === 'CART' ? 'flex' : 'hidden lg:flex'}`}>
                    {viewMode === 'VISUAL' ? (
                        <POSSidebar
                            activeCustomer={activeCustomer}
                            customers={customers}
                            cart={cart}
                            taxMode={activeSession.taxMode}
                            paymentMethod={activeSession.paymentMethod}
                            cartSubtotal={cartSubtotal}
                            taxAmount={taxAmount}
                            cartTotal={cartTotal}
                            isProcessing={isProcessing}
                            isBranchAll={currentBranch === 'All'}
                            hasMultipleBranches={hasMultipleBranches}
                            isPreOrder={isPreOrder}
                            onSetIsPreOrder={setIsPreOrder}
                            onCheckout={handleCheckout}
                            dispatch={dispatch}
                        />
                    ) : (
                        <div className="flex flex-col h-full bg-white dark:bg-slate-800 shadow-xl z-20">
                            <div className="shrink-0 p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                <POSCustomerPanel
                                    activeCustomer={activeCustomer}
                                    customers={customers}
                                    dispatch={dispatch}
                                />
                            </div>
                            <div className="flex-1 bg-slate-50 dark:bg-slate-900/20" />
                            <div className="shrink-0">
                                <POSFooter
                                    cart={cart}
                                    taxMode={activeSession.taxMode}
                                    paymentMethod={activeSession.paymentMethod}
                                    cartSubtotal={cartSubtotal}
                                    taxAmount={taxAmount}
                                    cartTotal={cartTotal}
                                    isProcessing={isProcessing}
                                    isBranchAll={currentBranch === 'All'}
                                    isEmpty={cart.length === 0}
                                    isPreOrder={isPreOrder}
                                    onSetIsPreOrder={setIsPreOrder}
                                    onCheckout={handleCheckout}
                                    dispatch={dispatch}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Tab Nav */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pb-safe z-50">
                <div className="flex justify-around items-center h-16 px-2">
                    <button
                        onClick={() => setMobileTab('MAIN')}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${mobileTab === 'MAIN' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <span className="text-[10px] font-medium">{viewMode === 'SCANNER' ? 'Scanner' : 'Products'}</span>
                    </button>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                    <button
                        onClick={() => setMobileTab('CART')}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${mobileTab === 'CART' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <div className="relative">
                            <ShoppingCart className="w-6 h-6" />
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {cart.reduce((a, b) => a + b.qty, 0)}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-medium">Cart: ₹{cartTotal.toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
