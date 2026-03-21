import React, { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { CartItem } from "@repo/shared";

interface DisplayState {
    cart: CartItem[];
    total: number;
    customerName?: string;
}

export const POSCustomerDisplay: React.FC = () => {
    const [state, setState] = useState<DisplayState>({
        cart: [],
        total: 0,
        customerName: 'Guest'
    });

    useEffect(() => {
        const channel = new BroadcastChannel('pos_display_channel');

        channel.onmessage = (event) => {
            if (event.data.type === 'UPDATE_CART') {
                setState(event.data.payload);
            }
        };

        // Signal readiness
        channel.postMessage({ type: 'DISPLAY_READY' });

        return () => {
            channel.close();
        };
    }, []);

    return (
        <div className="h-screen flex flex-col bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] text-main dark:text-slate-100 overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-indigo-600 text-white p-6 shadow-lg">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <ShoppingCart className="w-8 h-8" />
                    </div>
                    <span>My Store Name</span>
                </h1>
                <p className="text-indigo-200 mt-1 ml-15">Welcome, {state.customerName}</p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Cart List */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-[var(--erp-card)] m-4 rounded-2xl shadow-sm border border-default dark:border-default">
                    <h2 className="text-xl font-bold mb-4 border-b pb-2 dark:border-default">Your Basket</h2>

                    {state.cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted">
                            <ShoppingCart className="w-24 h-24 mb-4 opacity-10" />
                            <p className="text-2xl font-light">Your cart is empty</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {state.cart.map((item) => (
                                <div key={item.id} className="flex justify-between items-center py-2 border-b border-default dark:border-default last:border-0 animate-in slide-in-from-left-2 duration-300">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-main dark:text-slate-100">{item.name}</h3>
                                        <div className="flex gap-2 text-sm text-muted mt-1">
                                            {item.size && <span className="bg-[var(--erp-bg-sunken)] dark:bg-slate-700 px-2 py-0.5 rounded">Sz: {item.size}</span>}
                                            {item.color && <span className="bg-[var(--erp-bg-sunken)] dark:bg-slate-700 px-2 py-0.5 rounded">Col: {item.color}</span>}
                                            <span className="font-mono">{item.qty} {item.unit} x ₹{item.price}</span>
                                        </div>
                                    </div>
                                    <div className="text-xl font-bold text-secondary dark:text-slate-200 font-mono">
                                        ₹{(item.price * (item.unit === 'Meter' ? (item.cutLength || 1) * item.qty : item.qty)).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Side: Totals & Ads */}
                <div className="w-1/3 flex flex-col gap-4 p-4 pl-0">
                    {/* Total Card */}
                    <div className="bg-indigo-600 text-white rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center text-center">
                        <span className="text-indigo-200 uppercase tracking-widest font-bold mb-2">Total Amount</span>
                        <div className="text-6xl font-extrabold font-mono tracking-tight">
                            ₹{state.total.toFixed(2)}
                        </div>
                        <p className="mt-4 text-sm opacity-80">Including Taxes</p>
                    </div>

                    {/* QR / Payment / Ad Placeholder */}
                    <div className="flex-1 bg-white dark:bg-[var(--erp-card)] rounded-2xl border border-default dark:border-default p-6 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 z-0"></div>
                        <div className="z-10 text-center">
                            <span className="text-sm font-bold text-muted uppercase tracking-widest mb-4 block">Scan to Pay</span>
                            <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-sm mx-auto mb-4 border border-default">
                                {/* Placeholder QR */}
                                <div className="w-full h-full bg-[var(--erp-bg)] pattern-grid-lg opacity-10"></div>
                            </div>
                            <p className="text-muted font-medium">UPI / GPay / PhonePe</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="bg-white dark:bg-[var(--erp-card)] border-t border-default dark:border-default p-3 text-center text-xs text-muted uppercase tracking-widest">
                Thank you for shopping with us!
            </div>
        </div>
    );
};


export default POSCustomerDisplay;
