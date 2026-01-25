import React from 'react';
import { SalesReturn } from '../../../../src/types/salesReturn';
import { Wallet, CreditCard, RefreshCw, Banknote } from 'lucide-react';

interface ReturnSummaryProps {
    totalRefund: number;
    itemsCount: number;
    refundMethod: SalesReturn['refundMethod'];
    onMethodChange: (method: SalesReturn['refundMethod']) => void;
    onConfirm: () => void;
    isProcessing: boolean;
}

export const ReturnSummary: React.FC<ReturnSummaryProps> = ({
    totalRefund,
    itemsCount,
    refundMethod,
    onMethodChange,
    onConfirm,
    isProcessing
}) => {

    const methods = [
        { id: 'cash', label: 'Cash Refund', icon: Banknote, desc: 'Return cash from drawer' },
        { id: 'wallet', label: 'Store Credit / Wallet', icon: Wallet, desc: 'Add to customer balance' },
        { id: 'card', label: 'Card Refund', icon: CreditCard, desc: 'Refund to original card' },
        { id: 'exchange', label: 'Exchange', icon: RefreshCw, desc: 'Create exchange credit' },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Return Summary</h3>

            <div className="space-y-3 mb-8">
                <div className="flex justify-between text-slate-500">
                    <span>Items Returned</span>
                    <span>{itemsCount}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>₹{totalRefund.toFixed(2)}</span>
                </div>
                {/* Tax reversal calc to be refined */}

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-bold text-lg text-slate-900 dark:text-white">Total Refund</span>
                    <span className="font-bold text-2xl text-red-500">₹{totalRefund.toFixed(2)}</span>
                </div>
            </div>

            <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-3 text-sm uppercase">Refund Method</h4>
            <div className="grid grid-cols-2 gap-3 mb-8">
                {methods.map(method => {
                    const Icon = method.icon;
                    const isSelected = refundMethod === method.id;
                    return (
                        <button
                            key={method.id}
                            onClick={() => onMethodChange(method.id as any)}
                            className={`p-4 rounded-xl border text-left transition-all ${isSelected
                                ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500'
                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-indigo-300'}`}
                        >
                            <div className={`flex items-center gap-2 mb-1 ${isSelected ? 'text-indigo-700' : 'text-slate-800 dark:text-white'}`}>
                                <Icon className="w-4 h-4" />
                                <span className="font-bold">{method.label}</span>
                            </div>
                            <p className="text-xs text-slate-500">{method.desc}</p>
                        </button>
                    )
                })}
            </div>

            <button
                onClick={onConfirm}
                disabled={itemsCount === 0 || isProcessing}
                className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/20 transition-all transform active:scale-95"
            >
                {isProcessing ? 'Processing Return...' : `Confirm Refund ₹${totalRefund.toFixed(2)}`}
            </button>

            <p className="text-xs text-center text-slate-400 mt-4">
                This action will update inventory and create a credit note record.
            </p>
        </div>
    );
};
