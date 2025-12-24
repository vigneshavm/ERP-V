
import React from 'react';
import { CreditCard, AlertOctagon, Banknote, Smartphone, Check, Loader2 } from 'lucide-react';
import { AppDispatch, setTaxMode, setPaymentMethod } from '../../store';
import { TaxMode, PaymentMethod } from '../../types/common';
import { Session } from '../../types/sales';

interface POSFooterProps {
    cartSubtotal: number;
    taxAmount: number;
    cartTotal: number;
    activeSession: Session;
    isProcessing: boolean;
    isBranchAll: boolean;
    isEmpty: boolean;
    onCheckout: () => void;
    dispatch: AppDispatch;
}

export const POSFooter: React.FC<POSFooterProps> = ({
    cartSubtotal,
    taxAmount,
    cartTotal,
    activeSession,
    isProcessing,
    isBranchAll,
    isEmpty,
    onCheckout,
    dispatch
}) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg flex-1 flex flex-col min-h-0 transition-colors">
            <h3 className="text-indigo-500 dark:text-indigo-400 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Settlement
            </h3>

            {/* Toggles */}
            <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <span className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase">Tax Mode</span>
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                            {(['EXCLUSIVE', 'INCLUSIVE'] as TaxMode[]).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => dispatch(setTaxMode(mode))}
                                    className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${activeSession.taxMode === mode ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    {mode === 'EXCLUSIVE' ? '+ Tax' : 'Incl.'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-slate-500 mb-1.5 block uppercase">Payment</span>
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                            {(['CASH', 'CARD', 'UPI'] as PaymentMethod[]).map(method => (
                                <button
                                    key={method}
                                    onClick={() => dispatch(setPaymentMethod(method))}
                                    className={`flex-1 py-1.5 rounded-md flex flex-col items-center justify-center gap-0.5 transition-all ${activeSession.paymentMethod === method ? 'bg-emerald-600 text-white shadow font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                    title={method}
                                >
                                    {method === 'CASH' && <Banknote className="w-4 h-4" />}
                                    {method === 'CARD' && <Smartphone className="w-4 h-4" />}
                                    {method === 'UPI' && <Smartphone className="w-4 h-4" />}
                                    <span className="text-[9px] uppercase leading-none">{method}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {isBranchAll && (
                <div className="p-3 mb-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg flex items-start gap-3 text-yellow-700 dark:text-yellow-200 text-xs">
                    <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Select a specific branch from the top menu to enable checkout.</span>
                </div>
            )}

            <div className="mt-auto space-y-3">
                <div className="flex justify-between items-center text-sm border-t border-slate-200 dark:border-slate-700 pt-4">
                    <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">₹{cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Tax {activeSession.taxMode === 'INCLUSIVE' ? '(Included)' : ''}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end pt-2">
                    <span className="text-slate-700 dark:text-slate-300 font-bold text-lg">Total Payable</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-3xl font-mono tracking-tight">₹{cartTotal.toFixed(2)}</span>
                </div>

                <button
                    onClick={onCheckout}
                    disabled={isEmpty || isBranchAll || isProcessing}
                    className="relative w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:border disabled:border-slate-300 dark:disabled:border-slate-700 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 mt-4 text-lg group"
                    title="Shortcut: Ctrl + Space"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Check className="w-6 h-6" />
                            Finalize Bill
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] opacity-0 group-hover:opacity-60 transition-opacity bg-black/20 px-2 py-1 rounded">Ctrl+Space</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
