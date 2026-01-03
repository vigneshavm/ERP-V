
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
import { POSLogic } from '../../hooks/usePOSLogic';

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
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200">
            <div
                className="absolute inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <User className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-slate-800 dark:text-white truncate">{user?.name || 'Cashier'}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{user?.systemRole || 'Staff'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* View Switching */}
                    <section>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">POS View Mode</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => { setViewMode('SCANNER'); onClose(); }}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${viewMode === 'SCANNER' ? 'bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-400 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                            >
                                <TableIcon className="w-4 h-4" />
                                <span className="font-bold text-sm">Scanner</span>
                            </button>
                            <button
                                onClick={() => { setViewMode('VISUAL'); onClose(); }}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${viewMode === 'VISUAL' ? 'bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-400 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="font-bold text-sm">Visual</span>
                            </button>
                        </div>
                    </section>

                    {/* Quick Billing Actions */}
                    <section>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Billing Actions</h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => { setIsHeldBillsOpen(true); onClose(); }}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <PauseCircle className="w-5 h-5 text-amber-500" />
                                    <span className="font-bold text-slate-700 dark:text-slate-200">Recall Held Bills</span>
                                </div>
                                {(heldBills?.length || 0) > 0 && (
                                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
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
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100 dark:border-red-500/20 transition-colors"
                            >
                                <Trash2 className="w-5 h-5 text-red-600" />
                                <span className="font-bold text-red-700 dark:text-red-400">Clear Current Cart</span>
                            </button>
                        </div>
                    </section>

                    {/* Session Tabs (Mobile View) */}
                    <section>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billing Tabs</h4>
                            <button
                                onClick={addSession}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-indigo-600 dark:text-indigo-400"
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
                                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/30 font-bold'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span>{session.label}</span>
                                            {session.cart.length > 0 && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeSessionIndex === index ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                                    {session.cart.length} items
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                    {sessions.length > 1 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeSession(index); }}
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${activeSessionIndex === index ? 'hover:bg-indigo-500 text-indigo-200' : 'hover:bg-red-50 text-red-500'}`}
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
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">System Settings</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={toggleFullScreen}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{isFullScreen ? 'Minimize' : 'Full Screen'}</span>
                            </button>
                            <button
                                onClick={() => {
                                    window.open(window.location.origin + '?mode=customer_display', 'CustomerDisplay', 'width=800,height=600');
                                    onClose();
                                }}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <Monitor className="w-5 h-5" />
                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Cust. Display</span>
                            </button>
                        </div>
                    </section>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
                    <button
                        className="w-full flex items-center justify-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 transition-colors"
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
