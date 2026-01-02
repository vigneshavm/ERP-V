
import React from 'react';
import { CreditCard, AlertOctagon, Banknote, Smartphone, Check, Loader2, PackageCheck } from 'lucide-react';
import { TaxMode, PaymentMethod } from '../../types/common';
import { Customer } from '../../types/sales';
import { LoyaltyConfig } from '../../types/tenant';

interface POSFooterProps {
    cartSubtotal: number;
    taxAmount: number;
    cartTotal: number;
    redemptionAmount: number;
    finalTotal: number;
    taxMode: TaxMode;
    paymentMethod: PaymentMethod;
    isProcessing: boolean;
    isBranchAll: boolean;
    hasMultipleBranches: boolean;
    isEmpty: boolean;
    isPreOrder: boolean;
    activeCustomer: Customer;
    loyaltyConfig?: LoyaltyConfig;
    onSetTaxMode: (mode: TaxMode) => void;
    onSetPaymentMethod: (method: PaymentMethod) => void;
    onSetRedeemedPoints: (points: number) => void;
    onSetIsPreOrder: (val: boolean) => void;
    onCheckout: () => void;
}

export const POSFooter: React.FC<POSFooterProps> = ({
    cartSubtotal,
    taxAmount,
    cartTotal,
    redemptionAmount,
    finalTotal,
    taxMode,
    paymentMethod,
    isProcessing,
    isBranchAll,
    hasMultipleBranches,
    isEmpty,
    isPreOrder,
    activeCustomer,
    loyaltyConfig,
    onSetTaxMode,
    onSetPaymentMethod,
    onSetRedeemedPoints,
    onSetIsPreOrder,
    onCheckout
}) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-lg flex-1 flex flex-col min-h-0 transition-colors">
            <h3 className="text-indigo-500 dark:text-indigo-400 font-bold uppercase text-[10px] tracking-wider mb-3 flex items-center gap-2">
                <CreditCard className="w-3.5 h-4 text-indigo-400" /> Settlement
            </h3>

            {/* Redemption Section */}
            {activeCustomer.id !== 'c1' && loyaltyConfig && (
                <div className="mb-4 p-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Loyalty Redemption</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Bal: <span className="font-bold text-indigo-600 dark:text-indigo-400">{activeCustomer.points} pts</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="number"
                                placeholder="Points to redeem"
                                className="w-full pl-2 pr-8 py-1.5 text-xs bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                min="0"
                                max={activeCustomer.points}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    const maxPerBill = loyaltyConfig.maxRedemptionPerBill || Infinity;
                                    if (val > activeCustomer.points) return;
                                    if (val > maxPerBill) return;
                                    onSetRedeemedPoints(val);
                                }}
                            />
                            <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400">PTS</span>
                        </div>
                        <button
                            onClick={() => {
                                const min = loyaltyConfig.minPointsToRedeem || 0;
                                if (activeCustomer.points < min) {
                                    alert(`Minimum ${min} points required to redeem.`);
                                    return;
                                }
                                onSetRedeemedPoints(activeCustomer.points);
                            }}
                            className="px-2 py-1.5 text-[10px] font-bold bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors"
                        >
                            MAX
                        </button>
                    </div>
                    {redemptionAmount > 0 && (
                        <div className="mt-1.5 flex justify-between items-center text-[10px]">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Redemption Value:</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">-₹{redemptionAmount.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Toggles */}
            <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <span className="text-[9px] font-bold text-slate-400 mb-1 block uppercase">Tax Mode</span>
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                            {(['EXCLUSIVE', 'INCLUSIVE'] as TaxMode[]).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => onSetTaxMode(mode)}
                                    className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${taxMode === mode ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    {mode === 'EXCLUSIVE' ? '+ Tax' : 'Incl.'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <span className="text-[9px] font-bold text-slate-400 mb-1 block uppercase">Payment</span>
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                            {(['CASH', 'CARD', 'UPI'] as PaymentMethod[]).map(method => (
                                <button
                                    key={method}
                                    onClick={() => onSetPaymentMethod(method)}
                                    className={`flex-1 py-1.5 rounded-md flex flex-col items-center justify-center gap-0.5 transition-all ${paymentMethod === method ? 'bg-emerald-600 text-white shadow font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
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

                {/* Pre-order Toggle Removed */}
            </div>

            {isBranchAll && hasMultipleBranches && (
                <div className="p-3 mb-4 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg flex items-start gap-3 text-yellow-700 dark:text-yellow-200 text-xs">
                    <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Select a specific branch from the top menu to enable checkout.</span>
                </div>
            )}

            <div className="mt-auto space-y-1.5">
                <div className="flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-700 pt-2">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Subtotal</span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono">₹{cartSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Tax {taxMode === 'INCLUSIVE' ? '(Incl.)' : ''}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono text-indigo-500">₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-bold text-sm">Total Payable</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-2xl font-mono tracking-tight">₹{finalTotal.toFixed(2)}</span>
                </div>

                <button
                    onClick={onCheckout}
                    disabled={isEmpty || (isBranchAll && hasMultipleBranches) || isProcessing}
                    className="relative w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:border disabled:border-slate-300 dark:disabled:border-slate-700 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 mt-2 text-base group"
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
