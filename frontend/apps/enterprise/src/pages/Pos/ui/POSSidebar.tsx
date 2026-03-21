import React from 'react';
import { Customer, CartItem } from "@repo/shared";
import { TaxMode, PaymentMethod } from "@repo/shared";
import { POSCustomerPanel } from './POSCustomerPanel';
import { POSFooter } from './POSFooter';
import { Trash2 } from 'lucide-react';
import { LoyaltyConfig } from '@/entities/session/model/loyalty';

interface POSSidebarProps {
    activeCustomer: Customer;
    customers: Customer[];
    cart: CartItem[];
    taxMode: TaxMode;
    paymentMethod: PaymentMethod;
    cartSubtotal: number;
    taxAmount: number;
    cartTotal: number;
    redemptionAmount: number;
    finalTotal: number;
    isProcessing: boolean;
    isBranchAll: boolean;
    hasMultipleBranches: boolean;
    isPreOrder: boolean;
    loyaltyConfig?: LoyaltyConfig;
    onSetIsPreOrder: (val: boolean) => void;
    onCheckout: () => void;
    onSetCustomer: (id: string) => void;
    onLookupOrCreateCustomer: (phone: string, name?: string) => void;
    onRemoveFromCart: (id: string) => void;
    onUpdateCartQty: (id: string, qty: number) => void;
    onUpdateCartLength: (id: string, length: number) => void;
    onSetTaxMode: (mode: TaxMode) => void;
    onSetPaymentMethod: (method: PaymentMethod) => void;
    onSetRedeemedPoints: (points: number) => void;
}

export const POSSidebar: React.FC<POSSidebarProps> = ({
    activeCustomer,
    customers,
    cart,
    taxMode,
    paymentMethod,
    cartSubtotal,
    taxAmount,
    cartTotal,
    redemptionAmount,
    finalTotal,
    isProcessing,
    isBranchAll,
    hasMultipleBranches,
    isPreOrder,
    loyaltyConfig,
    onSetIsPreOrder,
    onCheckout,
    onSetCustomer,
    onLookupOrCreateCustomer,
    onRemoveFromCart,
    onUpdateCartQty,
    onUpdateCartLength,
    onSetTaxMode,
    onSetPaymentMethod,
    onSetRedeemedPoints
}) => {
    return (
        <div className="flex flex-col h-full bg-app shadow-2xl z-20 transition-all">
            {/* Customer Panel */}
            <div className="shrink-0 p-4 border-b border-default bg-[var(--erp-bg-sunken)]">
                <POSCustomerPanel
                    activeCustomer={activeCustomer}
                    customers={customers}
                    onSetCustomer={onSetCustomer}
                    onLookupOrCreateCustomer={onLookupOrCreateCustomer}
                />
            </div>

            {/* Cart List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                        <p className="text-sm">Cart is empty</p>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.id} className="erp-card p-2 rounded-xl flex flex-col gap-2 relative group hover:border-indigo-500/50 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="pr-6">
                                    <p className="font-black text-muted text-xs uppercase tracking-tight line-clamp-2">{item.name}</p>
                                    <p className="text-[9px] text-secondary font-mono tracking-tighter">{item.sku}</p>
                                    {(item.size || item.color) && (
                                        <div className="flex gap-1 mt-0.5">
                                            {item.size && <span className="text-[9px] bg-[var(--erp-bg-sunken)] dark:bg-neutral-700 px-1 rounded">Sz:{item.size}</span>}
                                            {item.color && <span className="text-[9px] bg-[var(--erp-bg-sunken)] dark:bg-neutral-700 px-1 rounded">Cl:{item.color}</span>}
                                        </div>
                                    )}
                                </div>
                                <p className="font-black text-[11px] text-indigo-400 font-mono">
                                    ₹{(item.price * (item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty)).toFixed(2)}
                                </p>
                            </div>

                            <button
                                onClick={() => onRemoveFromCart(item.id)}
                                className="absolute top-2 right-2 p-1 text-secondary hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div className="flex items-center justify-between mt-1">
                                <div className="text-[9px] text-muted font-black uppercase tracking-widest">
                                    ₹{item.price.toFixed(2)} / {item.unit}
                                </div>
                                <div className="flex items-center gap-1 bg-[var(--erp-bg-sunken)] rounded-lg p-0.5 border border-default">
                                    <button
                                        onClick={() => onUpdateCartQty(item.id, Math.max(0, item.qty - 1))}
                                        className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-muted font-black transition-colors"
                                    >-</button>
                                    <span className="w-8 text-center text-[10px] font-black text-muted">{item.qty}</span>
                                    <button
                                        onClick={() => onUpdateCartQty(item.id, item.qty + 1)}
                                        className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded text-indigo-400 font-black transition-colors"
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="shrink-0">
                <POSFooter
                    cartSubtotal={cartSubtotal}
                    taxAmount={taxAmount}
                    cartTotal={cartTotal}
                    redemptionAmount={redemptionAmount}
                    finalTotal={finalTotal}
                    taxMode={taxMode}
                    paymentMethod={paymentMethod}
                    isProcessing={isProcessing}
                    isBranchAll={isBranchAll}
                    hasMultipleBranches={hasMultipleBranches}
                    isEmpty={cart.length === 0}
                    isPreOrder={isPreOrder}
                    activeCustomer={activeCustomer}
                    loyaltyConfig={loyaltyConfig}
                    onSetTaxMode={onSetTaxMode}
                    onSetPaymentMethod={onSetPaymentMethod}
                    onSetRedeemedPoints={onSetRedeemedPoints}
                    onSetIsPreOrder={onSetIsPreOrder}
                    onCheckout={onCheckout}
                />
            </div>
        </div>
    );
};

