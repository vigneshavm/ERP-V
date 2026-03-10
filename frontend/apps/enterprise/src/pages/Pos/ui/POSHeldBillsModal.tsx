import React from 'react';
import { HeldBill } from "@/entities/sales/model/posSlice";
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
    const sortedBills = [...heldBills].sort((a: HeldBill, b: HeldBill) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">

                <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
                    <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Held Bills Queue
                        <span className="bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary-light text-xs px-2 py-0.5 rounded-full">
                            {heldBills.length}
                        </span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                    >
                        Close
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {sortedBills.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
                            <Clock className="w-12 h-12 mb-2 opacity-20" />
                            <p>No held bills found.</p>
                        </div>
                    ) : (
                        sortedBills.map((bill) => (
                            <div
                                key={bill.id}
                                className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-neutral-800 dark:text-neutral-100 truncate">
                                            {bill.session.customerId || 'Walk-in Customer'}
                                        </span>
                                        <span className="text-xs text-neutral-400 font-mono">
                                            {new Date(bill.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-neutral-500">
                                        <span className="flex items-center gap-1">
                                            <ShoppingCart className="w-3.5 h-3.5" />
                                            {bill.session.cart.reduce((sum: number, item: any) => sum + item.qty, 0)} Items
                                        </span>
                                        <span className="w-1 h-1 bg-neutral-300 rounded-full"></span>
                                        <span className="font-bold text-success">
                                            ₹{(bill.session.cart.reduce((sum: number, item: any) => sum + (item.price * item.qty), 0)).toFixed(2)}
                                        </span>
                                    </div>
                                    {bill.note && (
                                        <p className="text-xs text-primary mt-1 italic line-clamp-1">
                                            Note: "{bill.note}"
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onDiscard(bill.id)}
                                        className="p-2 text-neutral-400 hover:text-error hover:bg-error/10 dark:hover:bg-error/20 rounded-lg transition-colors"
                                        title="Discard Bill"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            onResume(bill.id);
                                            onClose();
                                        }}
                                        className="px-4 py-2 bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/40 text-primary dark:text-primary-light rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
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
