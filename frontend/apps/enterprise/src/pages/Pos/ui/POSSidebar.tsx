import React from 'react';
import { Customer, CartItem } from "@repo/shared-kernel";
import { TaxMode, PaymentMethod } from "@repo/shared-kernel";
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
        <div className="flex flex-col h-full bg-white dark:bg-neutral-800 shadow-xl z-20 transition-colors">
            {/* Customer Panel */}
            <div className="shrink-0 p-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
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
                        <div key={item.id} className="bg-white dark:bg-neutral-800 p-2 rounded-lg border border-neutral-100 dark:border-neutral-700 flex flex-col gap-2 relative group hover:border-primary/30 dark:hover:border-primary/50 transition-colors shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="pr-6">
                                    <p className="font-bold text-neutral-800 dark:text-neutral-100 text-sm line-clamp-2">{item.name}</p>
                                    <p className="text-[10px] text-neutral-400 font-mono">{item.sku}</p>
                                    {(item.size || item.color) && (
                                        <div className="flex gap-1 mt-0.5">
                                            {item.size && <span className="text-[9px] bg-neutral-100 dark:bg-neutral-700 px-1 rounded">Sz:{item.size}</span>}
                                            {item.color && <span className="text-[9px] bg-neutral-100 dark:bg-neutral-700 px-1 rounded">Cl:{item.color}</span>}
                                        </div>
                                    )}
                                </div>
                                <p className="font-bold text-sm text-neutral-900 dark:text-white">
                                    ₹{(item.price * (item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty)).toFixed(2)}
                                </p>
                            </div>

                            <button
                                onClick={() => onRemoveFromCart(item.id)}
                                className="absolute top-2 right-2 p-1 text-neutral-300 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div className="flex items-center justify-between mt-1">
                                <div className="text-xs text-neutral-500">
                                    ₹{item.price.toFixed(2)} / {item.unit}
                                </div>
                                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 rounded p-0.5">
                                    <button
                                        onClick={() => onUpdateCartQty(item.id, Math.max(0, item.qty - 1))}
                                        className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400 font-bold"
                                    >-</button>
                                    <span className="w-8 text-center text-xs font-bold">{item.qty}</span>
                                    <button
                                        onClick={() => onUpdateCartQty(item.id, item.qty + 1)}
                                        className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-neutral-700 rounded text-primary font-bold"
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
