import React from 'react';
import { ShoppingCart, LayoutGrid, Table as TableIcon, PauseCircle, Monitor, Printer, Download } from 'lucide-react';
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
import { POSMobileMenu } from '../POSMobileMenu';
import { Menu, CreditCard } from 'lucide-react';

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
        toggleFullScreen,
        setViewMode,
        setMobileTab,
        setIsPreOrder,
        setIsReturnMode,
        setIsHeldBillsOpen,
        handleCheckout,
        activeCounterId,
        activeCounterName,
        branches,
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
        switchSession,
        addSession,
        removeSession,
        resumeBill,
        discardHeldBill,
        isCategoryBrowserOpen,
        setIsCategoryBrowserOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        categories,
        getSubcategories,
        allProductTypes,
        posContainerRef,
        onClearCart,
        lastBill,
        reprintLastBill,
        downloadLastBill
    } = logic;

    return (
        <div
            ref={posContainerRef}
            className={`flex flex-col relative transition-all duration-300 ${isFullScreen ? 'h-screen fixed inset-0 z-50 bg-neutral-50 dark:bg-neutral-950 p-4 pb-20 lg:pb-4' : 'h-[calc(100vh-4rem)] pb-20 lg:pb-0'}`}
        >
            {/* Modals */}
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

            <POSMobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                logic={logic}
            />

            {/* Header with View Toggle */}
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
                            className="relative p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg flex items-center gap-2 transition-colors group"
                            title="Held Bills (F6)"
                        >
                            <PauseCircle className="w-5 h-5" />
                            <div className="flex flex-col items-start leading-none">
                                <span className="hidden md:inline font-bold text-sm">Held Bills</span>
                                <kbd className="text-[9px] opacity-50 font-mono tracking-tighter">F6</kbd>
                            </div>
                            {(heldBills?.length || 0) > 0 && (
                                <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-bold px-1.5 rounded-full">
                                    {heldBills?.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => window.open(window.location.origin + '?mode=customer_display', 'CustomerDisplay', 'width=800,height=600,menubar=0,toolbar=0')}
                            className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg flex items-center gap-2 transition-colors"
                            title="Customer Display"
                        >
                            <Monitor className="w-5 h-5" />
                        </button>

                        <div className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg flex gap-1 ml-2">
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
                                className={`px-3 py-1 bg-white dark:bg-neutral-700 rounded-md text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${viewMode === 'SCANNER' ? 'text-primary dark:text-primaryShadow shadow-sm' : 'bg-transparent text-neutral-500 hover:text-neutral-700'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <TableIcon className="w-3.5 h-3.5" /> Scanner
                                </div>
                                <kbd className="text-[9px] opacity-40 font-mono tracking-tighter">Alt+V</kbd>
                            </button>
                            <button
                                onClick={() => setViewMode('VISUAL')}
                                className={`px-3 py-1 bg-white dark:bg-neutral-800 rounded-md text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${viewMode === 'VISUAL' ? 'text-primary dark:text-primaryShadow shadow-sm' : 'bg-transparent text-neutral-500 hover:text-neutral-700'}`}
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

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 bg-neutral-100 dark:bg-neutral-900/50 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
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

                <div className={`col-span-12 lg:col-span-4 flex flex-col min-h-0 border-l border-neutral-200 dark:border-neutral-800 ${mobileTab === 'CART' ? 'flex' : 'hidden lg:flex'}`}>
                    {viewMode === 'VISUAL' ? (
                        <div className="flex flex-col h-full">
                            <POSTerminalInfo
                                cashierName={user?.name}
                                counterName={activeCounterName}
                                counterId={activeCounterId}
                            />
                            <POSSidebar
                                activeCustomer={activeCustomer}
                                customers={customers}
                                cart={cart}
                                taxMode={activeSession.taxMode}
                                paymentMethod={activeSession.paymentMethod}
                                cartSubtotal={cartSubtotal}
                                taxAmount={taxAmount}
                                cartTotal={cartTotal}
                                redemptionAmount={redemptionAmount}
                                finalTotal={finalTotal}
                                isProcessing={isProcessing}
                                isBranchAll={currentBranch === 'All'}
                                hasMultipleBranches={hasMultipleBranches}
                                isPreOrder={isPreOrder}
                                loyaltyConfig={loyaltyConfig}
                                onSetIsPreOrder={setIsPreOrder}
                                onCheckout={handleCheckout}
                                onSetCustomer={onSetCustomer}
                                onLookupOrCreateCustomer={onLookupOrCreateCustomer}
                                onRemoveFromCart={onRemoveFromCart}
                                onUpdateCartQty={onUpdateCartQty}
                                onUpdateCartLength={onUpdateCartLength}
                                onSetTaxMode={onSetTaxMode}
                                onSetPaymentMethod={onSetPaymentMethod}
                                onSetRedeemedPoints={onSetRedeemedPoints}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col h-full bg-white dark:bg-neutral-800 shadow-xl z-20">
                            <POSTerminalInfo
                                cashierName={user?.name}
                                counterName={activeCounterName}
                                counterId={activeCounterId}
                            />
                            <div className="shrink-0 p-2 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                                <POSCustomerPanel
                                    activeCustomer={activeCustomer}
                                    customers={customers}
                                    onSetCustomer={onSetCustomer}
                                    onLookupOrCreateCustomer={onLookupOrCreateCustomer}
                                />
                            </div>

                            {/* Last Bill Card */}
                            {lastBill && (
                                <div className="shrink-0 px-2 pb-1 bg-neutral-50 dark:bg-neutral-900/20">
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

                            <div className="shrink-0">
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
                    )}
                </div>
            </div>

            {/* Mobile Tab Nav */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 pb-safe z-50">
                <div className="flex justify-around items-center h-16 px-2">
                    <button
                        onClick={() => setMobileTab('MAIN')}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${mobileTab === 'MAIN' ? 'text-primary' : 'text-neutral-500 dark:text-neutral-400'}`}
                    >
                        <LayoutGrid className="w-6 h-6" />
                        <span className="text-[10px] font-medium">{viewMode === 'SCANNER' ? 'Scanner' : 'Products'}</span>
                    </button>
                    <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
                    <button
                        onClick={() => setMobileTab('CART')}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${mobileTab === 'CART' ? 'text-primary' : 'text-neutral-500 dark:text-neutral-400'}`}
                    >
                        <div className="relative">
                            <ShoppingCart className="w-6 h-6" />
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-error text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {cart.reduce((a, b) => a + b.qty, 0)}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-medium">Cart</span>
                    </button>
                    <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
                    <button
                        onClick={() => {
                            if (cart.length === 0) {
                                setMobileTab('MAIN');
                                return;
                            }
                            setMobileTab('CART');
                            // This would ideally scroll to footer or open settlement drawer
                        }}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 text-success`}
                    >
                        <CreditCard className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Settlement</span>
                    </button>
                    <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-800" />
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 text-neutral-500 dark:text-neutral-400`}
                    >
                        <Menu className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Menu</span>
                    </button>
                </div>
            </div>
        </div >
    );
};
export default StandardPOSTemplate;
