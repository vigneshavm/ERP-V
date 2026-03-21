import React from 'react';
import { ShoppingCart, LayoutGrid, Table as TableIcon, PauseCircle, Monitor, Printer, Download, Activity } from 'lucide-react';
import { usePOSLogic, POSLogic } from "@/features/pos-checkout/lib/usePOSLogic";
import { POSHeader } from '../ui/POSHeader';
import { POSSidebar } from '../ui/POSSidebar';
import { POSProductBrowser } from '../ui/POSProductBrowser';
import { POSCartGrid } from '../ui/POSCartGrid';
import { POSCustomerPanel } from '../ui/POSCustomerPanel';
import { POSFooter } from '../ui/POSFooter';
import { POSHeldBillsModal } from '../ui/POSHeldBillsModal';
import { POSTerminalInfo } from '../ui/POSTerminalInfo';
import { POSCategoryBrowserModal } from '../ui/POSCategoryBrowserModal';
import { POSMobileMenu } from '../ui/POSMobileMenu';
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
        // branches, // Removed as it's not in logic
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
        downloadLastBill,
        allBranches: branches
    } = logic;

    return (
        <div
            ref={posContainerRef}
            className={`flex flex-col relative transition-all duration-300 bg-app ${isFullScreen ? 'h-screen fixed inset-0 z-50 p-4 pb-20 lg:pb-4' : 'h-[calc(100vh-4rem)] pb-20 lg:pb-0'}`}
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
                onAddToCart={(product: any) => onAddToCart(product)}
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
                        currentBranch={currentBranch || ''}
                    />
                    <div className="flex gap-2 mr-2">
                        {/* Sync Engine Status */}
                        <div className="hidden lg:flex items-center gap-3 px-4 py-2 erp-card mr-2">
                            <div className="relative">
                                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                                <div className="absolute inset-0 bg-emerald-400/20 blur-md rounded-full animate-ping" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-muted uppercase tracking-widest leading-none">Sync Engine</span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase mt-0.5 tracking-tighter">Live • 12ms</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsHeldBillsOpen(true)}
                            className="relative p-2 erp-card hover:border-indigo-500/50 text-muted rounded-xl flex items-center gap-2 transition-all group hover:-translate-y-0.5"
                            title="Held Bills (F6)"
                        >
                            <PauseCircle className="w-5 h-5 text-indigo-400" />
                            <div className="flex flex-col items-start leading-none pr-1">
                                <span className="hidden md:inline font-black text-[11px] uppercase tracking-tight">Held Bills</span>
                                <kbd className="text-[8px] opacity-40 font-mono tracking-tighter font-black">F6</kbd>
                            </div>
                            {(heldBills?.length || 0) > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-default shadow-lg group-hover:scale-110 transition-transform">
                                    {heldBills?.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => window.open(window.location.origin + '?mode=customer_display', 'CustomerDisplay', 'width=800,height=600,menubar=0,toolbar=0')}
                            className="p-2 erp-card hover:border-indigo-500/50 text-muted rounded-xl flex items-center gap-2 transition-all hover:-translate-y-0.5"
                            title="Customer Display"
                        >
                            <Monitor className="w-5 h-5 text-indigo-400" />
                        </button>

                        <div className="erp-card p-1 flex gap-1 ml-2">
                            <div className="flex bg-[var(--erp-bg-sunken)] p-1 rounded-lg mr-1">
                                <button
                                    onClick={() => setIsReturnMode(false)}
                                    className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${!isReturnMode ? 'bg-indigo-600 text-white shadow-lg' : 'text-muted hover:text-muted'}`}
                                >
                                    Sale
                                </button>
                                <button
                                    onClick={() => setIsReturnMode(true)}
                                    className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${isReturnMode ? 'bg-rose-600 text-white shadow-lg' : 'text-muted hover:text-muted'}`}
                                >
                                    Return
                                </button>
                            </div>

                            <button
                                onClick={() => setViewMode('SCANNER')}
                                className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'SCANNER' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-muted hover:text-muted'}`}
                            >
                                <TableIcon className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Scanner</span>
                            </button>
                            <button
                                onClick={() => setViewMode('VISUAL')}
                                className={`px-4 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'VISUAL' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-muted hover:text-muted'}`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline">Visual</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 bg-[var(--erp-bg-sunken)] rounded-xl overflow-hidden border border-default">
                <div className={`col-span-12 lg:col-span-8 flex flex-col min-h-0 ${mobileTab === 'MAIN' ? 'flex' : 'hidden lg:flex'}`}>
                    {viewMode === 'VISUAL' ? (
                        <POSProductBrowser
                            products={products}
                            currentBranch={currentBranch || 'All'}
                            currentSector={(currentSector as any) || 'Retail'}
                            onAddToCart={(product: any) => onAddToCart(product)}
                        />
                    ) : (
                        <POSCartGrid
                            cart={cart}
                            products={products}
                            currentSector={(currentSector as any) || 'Retail'}
                            currentBranch={currentBranch || 'All'}
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

                <div className={`col-span-12 lg:col-span-4 flex flex-col min-h-0 border-l border-default ${mobileTab === 'CART' ? 'flex' : 'hidden lg:flex'}`}>
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
                                onSetTaxMode={(mode: any) => onSetTaxMode(mode)}
                                onSetPaymentMethod={onSetPaymentMethod}
                                onSetRedeemedPoints={onSetRedeemedPoints}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col h-full erp-card shadow-2xl z-20">
                            <POSTerminalInfo
                                cashierName={user?.name}
                                counterName={activeCounterName}
                                counterId={activeCounterId}
                            />
                            <div className="shrink-0 p-2 border-b border-default bg-[var(--erp-bg-sunken)]">
                                <POSCustomerPanel
                                    activeCustomer={activeCustomer}
                                    customers={customers}
                                    onSetCustomer={onSetCustomer}
                                    onLookupOrCreateCustomer={onLookupOrCreateCustomer}
                                />
                            </div>

                            {/* Last Bill Card */}
                            {lastBill && (
                                <div className="shrink-0 px-2 pb-1 bg-[var(--erp-bg-sunken)]">
                                    <div className="bg-[var(--erp-bg-sunken)] border border-default rounded-lg p-2 shadow-sm">
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
                                             <div className="flex items-center gap-1.5 text-[10px] text-muted leading-none">
                                                <span className="font-medium text-muted">#{lastBill.id.split('-').pop()}</span>
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
                                    onSetTaxMode={(mode: any) => onSetTaxMode(mode)}
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
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-neutral-950 border-t border-default pb-safe z-50">
                <div className="flex justify-around items-center h-16 px-2">
                    <button
                        onClick={() => setMobileTab('MAIN')}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${mobileTab === 'MAIN' ? 'text-primary' : 'text-neutral-500 dark:text-neutral-400'}`}
                    >
                        <LayoutGrid className="w-6 h-6" />
                        <span className="text-[10px] font-medium">{viewMode === 'SCANNER' ? 'Scanner' : 'Products'}</span>
                    </button>
                    <div className="w-px h-8 bg-neutral-200 dark:bg-[var(--erp-card)]" />
                    <button
                        onClick={() => setMobileTab('CART')}
                        className={`flex flex-col items-center justify-center w-full h-full gap-1 ${mobileTab === 'CART' ? 'text-primary' : 'text-neutral-500 dark:text-neutral-400'}`}
                    >
                        <div className="relative">
                            <ShoppingCart className="w-6 h-6" />
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-error text-main text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {cart.reduce((a, b) => a + b.qty, 0)}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-medium">Cart</span>
                    </button>
                    <div className="w-px h-8 bg-neutral-200 dark:bg-[var(--erp-card)]" />
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
                    <div className="w-px h-8 bg-neutral-200 dark:bg-[var(--erp-card)]" />
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
