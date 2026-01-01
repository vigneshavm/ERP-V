import React from 'react';
import { HeldBill } from '../../store/posSlice';
import { Clock, User, Trash2, ArrowRightCircle, ShoppingCart } from 'lucide-react';

interface POSHeldBillsModalProps {
    isOpen: boolean;
    onClose: () => void;
    heldBills: HeldBill[];
    onResume: (id: string) => void;
    onDiscard: (id: string) => void;
}

export const POSHeldBillsModal: React.FC<POSHeldBillsModalProps> = ({
    isOpen,
    onClose,
    heldBills,
    onResume,
    onDiscard
}) => {
    if (!isOpen) return null;

    // Sort by newest first
    const sortedBills = [...heldBills].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">

                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        Held Bills Queue
                        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full">
                            {heldBills.length}
                        </span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                        Close
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {sortedBills.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                            <Clock className="w-12 h-12 mb-2 opacity-20" />
                            <p>No held bills found.</p>
                        </div>
                    ) : (
                        sortedBills.map((bill) => (
                            <div
                                key={bill.id}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                            {bill.customerName || 'Walk-in Customer'}
                                        </span>
                                        <span className="text-xs text-slate-400 font-mono">
                                            {new Date(bill.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <ShoppingCart className="w-3.5 h-3.5" />
                                            {bill.cart.reduce((a, b) => a + b.qty, 0)} Items
                                        </span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <span className="font-bold text-emerald-600">
                                            ₹{bill.total.toFixed(2)}
                                        </span>
                                    </div>
                                    {bill.note && (
                                        <p className="text-xs text-indigo-500 mt-1 italic line-clamp-1">
                                            Note: "{bill.note}"
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onDiscard(bill.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Discard Bill"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            onResume(bill.id);
                                            onClose();
                                        }}
                                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                                    >
                                        Resume
                                        <ArrowRightCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
