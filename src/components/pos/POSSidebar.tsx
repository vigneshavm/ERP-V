import React from 'react';
import { Customer } from '../../types/sales';
import { AppDispatch, removeFromCart, updateCartQty } from '../../store';
import { POSCustomerPanel } from './POSCustomerPanel';
import { POSFooter } from './POSFooter';
import { CartItem } from '../../types/sales';
import { Trash2 } from 'lucide-react';

interface POSSidebarProps {
    activeCustomer: Customer;
    customers: Customer[];
    cart: CartItem[];
    taxMode: 'INCLUSIVE' | 'EXCLUSIVE';
    paymentMethod: 'CASH' | 'CARD' | 'UPI';
    cartSubtotal: number;
    taxAmount: number;
    cartTotal: number;
    isProcessing: boolean;
    isBranchAll: boolean;
    hasMultipleBranches: boolean;
    isPreOrder: boolean;
    onSetIsPreOrder: (val: boolean) => void;
    onCheckout: () => void;
    dispatch: AppDispatch;
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
    isProcessing,
    isBranchAll,
    hasMultipleBranches,
    isPreOrder,
    onSetIsPreOrder,
    onCheckout,
    dispatch
}) => {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 shadow-xl z-20">
            {/* Customer Panel */}
            <div className="shrink-0 p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <POSCustomerPanel
                    activeCustomer={activeCustomer}
                    customers={customers}
                    dispatch={dispatch}
                />
            </div>

            {/* Cart List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <p className="text-sm">Cart is empty</p>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 flex flex-col gap-2 relative group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="pr-6">
                                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-2">{item.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{item.sku}</p>
                                    {(item.size || item.color) && (
                                        <div className="flex gap-1 mt-0.5">
                                            {item.size && <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1 rounded">Sz:{item.size}</span>}
                                            {item.color && <span className="text-[9px] bg-slate-100 dark:bg-slate-700 px-1 rounded">Cl:{item.color}</span>}
                                        </div>
                                    )}
                                </div>
                                <p className="font-bold text-sm text-slate-900 dark:text-white">
                                    ₹{(item.price * (item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty)).toFixed(2)}
                                </p>
                            </div>

                            <button
                                onClick={() => dispatch(removeFromCart(item.id))}
                                className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div className="flex items-center justify-between mt-1">
                                <div className="text-xs text-slate-500">
                                    ₹{item.price.toFixed(2)} / {item.unit}
                                </div>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded p-0.5">
                                    <button
                                        onClick={() => dispatch(updateCartQty({ id: item.id, qty: Math.max(0, item.qty - 1) }))}
                                        className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400 font-bold"
                                    >-</button>
                                    <span className="w-8 text-center text-xs font-bold">{item.qty}</span>
                                    <button
                                        onClick={() => dispatch(updateCartQty({ id: item.id, qty: item.qty + 1 }))}
                                        className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 rounded text-indigo-600 font-bold"
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
                    cart={cart}
                    taxMode={taxMode}
                    paymentMethod={paymentMethod}
                    cartSubtotal={cartSubtotal}
                    taxAmount={taxAmount}
                    cartTotal={cartTotal}
                    isProcessing={isProcessing}
                    isBranchAll={isBranchAll}
                    hasMultipleBranches={hasMultipleBranches}
                    isEmpty={cart.length === 0}
                    isPreOrder={isPreOrder}
                    onSetIsPreOrder={onSetIsPreOrder}
                    onCheckout={onCheckout}
                    dispatch={dispatch}
                />
            </div>
        </div>
    );
};
