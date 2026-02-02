
import React from 'react';
import { CreditCard, AlertOctagon, Banknote, Smartphone, Check, Loader2, PackageCheck } from 'lucide-react';
import { TaxMode, PaymentMethod } from "../../../types/common";
import { Customer } from "../../../types/sales";
import { LoyaltyConfig } from "../../../types/tenant";

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
    isRefund?: boolean;
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
    isRefund,
    activeCustomer,
    loyaltyConfig,
    onSetTaxMode,
    onSetPaymentMethod,
    onSetRedeemedPoints,
    onSetIsPreOrder,
    onCheckout
}) => {
    return (
        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 sm:p-4 shadow-lg flex-1 flex flex-col min-h-0 transition-colors">
            <h3 className="text-secondary font-bold uppercase text-[10px] tracking-wider mb-3 flex items-center gap-2">
                <CreditCard className="w-3.5 h-4 text-secondary/70" /> Settlement
            </h3>

            {/* Redemption Section */}
            {activeCustomer.id !== 'c1' && loyaltyConfig && (
                <div className="mb-4 p-2.5 bg-secondary/5 dark:bg-secondary/10 border border-secondary/20 rounded-lg">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-secondary uppercase">Loyalty Redemption</span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Bal: <span className="font-bold text-secondary">{activeCustomer.points} pts</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="number"
                                placeholder="Points to redeem"
                                className="w-full pl-2 pr-8 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-secondary/30 dark:border-neutral-700 rounded focus:outline-none focus:ring-1 focus:ring-secondary font-mono"
                                min="0"
                                max={activeCustomer.points}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    const maxPercentage = loyaltyConfig.maxRedeemPercentage || 100;
                                    const maxPerBill = (cartTotal * maxPercentage) / 100;
                                    if (val > activeCustomer.points) return;
                                    if (val * (loyaltyConfig.pointValue || 1) > maxPerBill) {
                                        alert(`Maximum redemption for this bill is ₹${maxPerBill.toFixed(2)} (${maxPercentage}%).`);
                                        return;
                                    }
                                    onSetRedeemedPoints(val);
                                }}
                            />
                            <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400">PTS</span>
                        </div>
                        <button
                            onClick={() => {
                                const min = loyaltyConfig.minRedeemPoints || 0;
                                if (activeCustomer.points < min) {
                                    alert(`Minimum ${min} points required to redeem.`);
                                    return;
                                }
                                onSetRedeemedPoints(activeCustomer.points);
                            }}
                            className="px-2 py-1.5 text-[10px] font-bold bg-secondary text-white rounded hover:bg-secondary/90 transition-colors"
                        >
                            MAX
                        </button>
                    </div>
                    {redemptionAmount > 0 && (
                        <div className="mt-1.5 flex justify-between items-center text-[10px]">
                            <span className="text-success font-bold">Redemption Value:</span>
                            <span className="text-success font-bold">-₹{(redemptionAmount || 0).toFixed(2)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Toggles */}
            <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <span className="text-[9px] font-bold text-neutral-400 mb-1 block uppercase">Tax Mode</span>
                        <div className="flex bg-neutral-100 dark:bg-neutral-900 rounded-lg p-1 border border-neutral-200 dark:border-neutral-700">
                            {(['EXCLUSIVE', 'INCLUSIVE'] as TaxMode[]).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => onSetTaxMode(mode)}
                                    className={`flex-1 text-[10px] py-1.5 rounded-md font-bold transition-all ${taxMode === mode ? 'bg-secondary text-white shadow' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
                                >
                                    {mode === 'EXCLUSIVE' ? '+ Tax' : 'Incl.'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <span className="text-[9px] font-bold text-neutral-400 mb-1 block uppercase">Payment</span>
                        <div className="flex bg-neutral-100 dark:bg-neutral-900 rounded-lg p-1 border border-neutral-200 dark:border-neutral-700">
                            {(['CASH', 'CARD', 'UPI'] as PaymentMethod[]).map(method => (
                                <button
                                    key={method}
                                    onClick={() => onSetPaymentMethod(method)}
                                    className={`flex-1 py-1.5 rounded-md flex flex-col items-center justify-center gap-0.5 transition-all ${paymentMethod === method ? 'bg-success text-white shadow font-bold' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
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


            <div className="mt-auto space-y-1.5">
                <div className="flex justify-between items-center text-xs border-t border-neutral-200 dark:border-neutral-700 pt-2">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">Subtotal</span>
                    <span className="text-neutral-800 dark:text-neutral-200 font-mono">₹{(cartSubtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400 font-medium">Tax {taxMode === 'INCLUSIVE' ? '(Incl.)' : ''}</span>
                    <span className="text-secondary font-mono">₹{(taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end pt-1">
                    <span className="text-neutral-700 dark:text-neutral-300 font-bold text-sm">
                        {isRefund ? 'Refund Amount' : 'Total Payable'}
                    </span>
                    <span className={`font-bold text-2xl font-mono tracking-tight ${isRefund ? 'text-error' : 'text-success'}`}>
                        ₹{Math.abs(finalTotal || 0).toFixed(2)}
                    </span>
                </div>

                <button
                    onClick={onCheckout}
                    disabled={isEmpty || isProcessing}
                    className="relative w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:border disabled:border-neutral-300 dark:disabled:border-neutral-700 disabled:text-neutral-400 dark:disabled:text-neutral-600 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 mt-2 text-base group"
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
