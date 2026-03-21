
import React from 'react';
import {
    X,
    PauseCircle,
    Monitor,
    Maximize2,
    Minimize2,
    PlusCircle,
    Trash2,
    LayoutGrid,
    Table as TableIcon,
    LogOut,
    User,
    Settings,
    MoreHorizontal
} from 'lucide-react';
import { POSLogic } from "@/features/pos-checkout/lib/usePOSLogic";

interface POSMobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    logic: POSLogic;
}

export const POSMobileMenu: React.FC<POSMobileMenuProps> = ({ isOpen, onClose, logic }) => {
    const {
        user,
        sessions,
        activeSessionIndex,
        switchSession,
        addSession,
        removeSession,
        isFullScreen,
        toggleFullScreen,
        viewMode,
        setViewMode,
        setIsHeldBillsOpen,
        heldBills,
        onClearCart,
        cart
    } = logic;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-[var(--erp-bg)]/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200">
            <div
                className="absolute inset-y-0 right-0 w-80 bg-white dark:bg-[var(--erp-bg)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-default dark:border-default flex justify-between items-center bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/30 flex items-center justify-center text-primary dark:text-primary-light">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-neutral-800 dark:text-main truncate">{user?.name || 'Cashier'}</p>
                            <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{user?.systemRole || 'Staff'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-200 dark:hover:bg-[var(--erp-card)] rounded-full text-neutral-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* View Switching */}
                    <section>
                        <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">POS View Mode</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => { setViewMode('SCANNER'); onClose(); }}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${viewMode === 'SCANNER' ? 'bg-primary/5 border-primary text-primary dark:bg-primary/20 dark:border-primary-light dark:text-primary-light' : 'bg-white dark:bg-[var(--erp-card)] border-default dark:border-default text-neutral-500'}`}
                            >
                                <TableIcon className="w-4 h-4" />
                                <span className="font-bold text-sm">Scanner</span>
                            </button>
                            <button
                                onClick={() => { setViewMode('VISUAL'); onClose(); }}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${viewMode === 'VISUAL' ? 'bg-primary/5 border-primary text-primary dark:bg-primary/20 dark:border-primary-light dark:text-primary-light' : 'bg-white dark:bg-[var(--erp-card)] border-default dark:border-default text-neutral-500'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="font-bold text-sm">Visual</span>
                            </button>
                        </div>
                    </section>

                    {/* Quick Billing Actions */}
                    <section>
                        <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">Billing Actions</h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => { setIsHeldBillsOpen(true); onClose(); }}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-700 border border-default dark:border-default transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <PauseCircle className="w-5 h-5 text-warning" />
                                    <span className="font-bold text-neutral-700 dark:text-neutral-200">Recall Held Bills</span>
                                </div>
                                {(heldBills?.length || 0) > 0 && (
                                    <span className="bg-warning text-main text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        {heldBills?.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    if (cart.length > 0 && window.confirm('Clear current cart?')) {
                                        onClearCart();
                                        onClose();
                                    }
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-error/5 dark:bg-error/10 hover:bg-error/10 dark:hover:bg-error/20 border border-error/10 dark:border-error/20 transition-colors"
                            >
                                <Trash2 className="w-5 h-5 text-error" />
                                <span className="font-bold text-error dark:text-error-light">Clear Current Cart</span>
                            </button>
                        </div>
                    </section>

                    {/* Session Tabs (Mobile View) */}
                    <section>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Billing Tabs</h4>
                            <button
                                onClick={addSession}
                                className="p-1 hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-card)] rounded-lg text-primary dark:text-primary-light"
                            >
                                <PlusCircle className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {sessions.map((session, index) => (
                                <div key={session.id} className="relative group">
                                    <button
                                        onClick={() => { switchSession(index); onClose(); }}
                                        className={`w-full text-left p-3 rounded-xl border transition-all ${activeSessionIndex === index
                                            ? 'bg-primary border-primary shadow-lg shadow-primary/20 text-white font-bold'
                                            : 'bg-white dark:bg-[var(--erp-card)] border-default dark:border-default text-neutral-700 dark:text-neutral-200 hover:bg-[var(--erp-bg-sunken)]'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span>{session.label}</span>
                                            {session.cart.length > 0 && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeSessionIndex === index ? 'bg-white/20' : 'bg-[var(--erp-bg-sunken)] dark:bg-neutral-700'}`}>
                                                    {session.cart.length} items
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                    {sessions.length > 1 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeSession(index); }}
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${activeSessionIndex === index ? 'hover:bg-white/10 text-secondary' : 'hover:bg-error/10 text-error'}`}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* System Settings */}
                    <section>
                        <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">System Settings</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={toggleFullScreen}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-700 transition-colors"
                            >
                                {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">{isFullScreen ? 'Minimize' : 'Full Screen'}</span>
                            </button>
                            <button
                                onClick={() => {
                                    window.open(window.location.origin + '?mode=customer_display', 'CustomerDisplay', 'width=800,height=600');
                                    onClose();
                                }}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-700 transition-colors"
                            >
                                <Monitor className="w-5 h-5" />
                                <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400">Cust. Display</span>
                            </button>
                        </div>
                    </section>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-default dark:border-default bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/80">
                    <button
                        className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] text-neutral-700 dark:text-neutral-200 font-bold hover:bg-neutral-200 transition-colors"
                        onClick={() => { /* Potential logout or settings page */ onClose(); }}
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </button>
                </div>
            </div>
        </div>
    );
};
