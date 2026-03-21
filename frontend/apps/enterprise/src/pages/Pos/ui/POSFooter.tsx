
import React from 'react';
import { CreditCard, AlertOctagon, Banknote, Smartphone, Check, Loader2, PackageCheck } from 'lucide-react';
import { TaxMode, PaymentMethod } from "@repo/shared";
import { Customer } from "@repo/shared";
import { LoyaltyConfig } from '@/entities/session/model/loyalty';

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
        <div className="erp-card p-3 sm:p-4 shadow-2xl flex-1 flex flex-col min-h-0 transition-all border-default">
            <h3 className="text-muted font-black uppercase text-[10px] tracking-widest mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" /> Settlement
            </h3>

            {/* Redemption Section */}
            {activeCustomer.id !== 'c1' && loyaltyConfig && (
                <div className="mb-4 p-2.5 bg-indigo-600/5 border border-indigo-500/20 rounded-xl">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Loyalty Redemption</span>
                        <span className="text-[10px] text-muted">Bal: <span className="font-black text-muted">{activeCustomer.points} pts</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input
                                type="number"
                                placeholder="Points to redeem"
                                className="w-full pl-2 pr-8 py-1.5 text-xs bg-[var(--erp-bg-sunken)] border border-default rounded focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono text-slate-200"
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
                            <span className="absolute right-2 top-1.5 text-[10px] font-bold text-muted">PTS</span>
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
                            className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                        >
                            MAX
                        </button>
                    </div>
                    {redemptionAmount > 0 && (
                        <div className="mt-1.5 flex justify-between items-center text-[10px]">
                            <span className="text-emerald-400 font-black uppercase tracking-widest">Redemption Value:</span>
                            <span className="text-emerald-400 font-black font-mono">-₹{(redemptionAmount || 0).toFixed(2)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Toggles */}
            <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <span className="text-[9px] font-black text-muted mb-1 block uppercase tracking-widest">Tax Mode</span>
                        <div className="flex bg-[var(--erp-bg-sunken)] rounded-xl p-1 border border-default">
                            {(['EXCLUSIVE', 'INCLUSIVE'] as TaxMode[]).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => onSetTaxMode(mode)}
                                    className={`flex-1 text-[10px] py-1.5 rounded-lg font-black uppercase tracking-widest transition-all ${taxMode === mode ? 'bg-indigo-600 text-white shadow-lg' : 'text-muted hover:text-muted'}`}
                                >
                                    {mode === 'EXCLUSIVE' ? '+ Tax' : 'Incl.'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-muted mb-1 block uppercase tracking-widest">Payment</span>
                        <div className="flex bg-[var(--erp-bg-sunken)] rounded-xl p-1 border border-default">
                            {(['CASH', 'CARD', 'UPI'] as PaymentMethod[]).map(method => (
                                <button
                                    key={method}
                                    onClick={() => onSetPaymentMethod(method)}
                                    className={`flex-1 py-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all ${paymentMethod === method ? 'bg-emerald-600 text-white shadow-lg font-black' : 'text-muted hover:text-muted'}`}
                                    title={method}
                                >
                                    {method === 'CASH' && <Banknote className="w-4 h-4" />}
                                    {method === 'CARD' && <Smartphone className="w-4 h-4" />}
                                    {method === 'UPI' && <Smartphone className="w-4 h-4" />}
                                    <span className="text-[9px] uppercase font-black leading-none">{method}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>


            <div className="mt-auto space-y-1.5">
                <div className="flex justify-between items-center text-xs border-t border-default pt-3">
                    <span className="text-muted font-black uppercase tracking-widest">Subtotal</span>
                    <span className="text-muted font-black font-mono">₹{(cartSubtotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-muted font-black uppercase tracking-widest">Tax {taxMode === 'INCLUSIVE' ? '(Incl.)' : ''}</span>
                    <span className="text-indigo-400 font-black font-mono">₹{(taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end pt-2">
                    <span className="text-muted font-black uppercase text-[10px] tracking-widest mb-1">
                        {isRefund ? 'Refund' : 'Payable'}
                    </span>
                    <span className={`font-black text-3xl font-mono tracking-tighter ${isRefund ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ₹{Math.abs(finalTotal || 0).toFixed(2)}
                    </span>
                </div>

                <button
                    onClick={onCheckout}
                    disabled={isEmpty || isProcessing}
                    className="relative w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-main font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 mt-3 text-lg group overflow-hidden"
                    title="Shortcut: Ctrl + Space"
                >
                    <div className="absolute inset-0 bg-[var(--erp-bg-sunken)] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Processing
                        </>
                    ) : (
                        <>
                            <PackageCheck className="w-6 h-6" />
                            Finalize Bill
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] opacity-0 group-hover:opacity-60 transition-opacity bg-black/40 px-2 py-1 rounded-lg border border-default font-mono tracking-tighter">Ctrl+Space</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

