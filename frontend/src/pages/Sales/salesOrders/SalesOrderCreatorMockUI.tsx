import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Plus, FileText, ArrowLeft, Trash2, Zap } from 'lucide-react';
import { inventory, customers, MockProduct } from '../../../data';
import Layout from '../../../components/shared/Layout';

const SalesOrderCreatorMockUI: React.FC = () => {
    const navigate = useNavigate();
    
    // Use sample items from real inventory
    const lineItems = useMemo(() => {
        return (inventory as MockProduct[]).slice(2, 5).map(item => ({
            id: item.id,
            name: item.name,
            qty: 5,
            rate: item.selling_price,
            total: 5 * item.selling_price
        }));
    }, []);

    const summary = useMemo(() => {
        const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
        const tax = subtotal * 0.18;
        return {
            subtotal,
            tax,
            total: subtotal + tax
        };
    }, [lineItems]);

    return (
        <Layout>
            <div className="p-8 space-y-8 max-w-7xl mx-auto text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate(-1)}
                            className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-sm transition-all border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                        >
                            <ArrowLeft className="w-5 h-5 text-warning" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white">
                                Sales Order <span className="text-warning">Creator</span>
                            </h1>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                                Command Center V4 // Dynamic Fulfillment Logic
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-xs font-black uppercase tracking-widest shadow-sm">
                            <X className="w-4 h-4" /> Cancel
                        </button>
                        <button className="flex items-center gap-2 px-8 py-3 bg-amber-500 text-white border border-amber-600 rounded-sm hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all text-xs font-black uppercase tracking-widest">
                            <Save className="w-4 h-4" /> Commit Order
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form Area */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm space-y-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-3">
                                <FileText className="w-4 h-4 text-warning" /> Order Manifest Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Select Customer</label>
                                    <select className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm p-4 text-xs font-bold focus:border-amber-500/50 outline-none transition-all text-neutral-900 dark:text-white uppercase tracking-widest shadow-inner">
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Expected Delivery</label>
                                    <input type="date" className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm p-4 text-xs font-bold focus:border-amber-500/50 outline-none transition-all text-neutral-900 dark:text-white shadow-inner" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm space-y-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                            <div className="flex justify-between items-center">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Inventory Items</h2>
                                <button className="text-[10px] px-4 py-2 bg-warning/10 text-warning hover:bg-warning/20 rounded-sm border border-warning/20 flex items-center gap-2 transition-all font-black uppercase tracking-widest">
                                    <Plus className="w-3.5 h-3.5" /> Add SKU
                                </button>
                            </div>
                            <div className="bg-neutral-50 dark:bg-neutral-950 rounded-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-inner">
                                <table className="w-full text-left">
                                    <thead className="bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
                                        <tr className="text-[9px] font-black uppercase tracking-widest">
                                            <th className="p-4">Item Identity</th>
                                            <th className="p-4 text-right w-24">Quantity</th>
                                            <th className="p-4 text-right w-32">Unit Price</th>
                                            <th className="p-4 text-right w-32">Total</th>
                                            <th className="p-4 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                        {lineItems.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-amber-500/[0.02] transition-colors group">
                                                <td className="p-4">
                                                    <div className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight">{item.name}</div>
                                                    <div className="text-[9px] text-neutral-500 font-bold uppercase mt-0.5">SKU ID: {item.id}</div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <input type="number" className="w-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-2 text-right text-xs font-black" value={item.qty} />
                                                </td>
                                                <td className="p-4 text-right text-sm font-mono font-bold text-neutral-500">₹{item.rate.toLocaleString()}</td>
                                                <td className="p-4 text-right font-mono font-black text-neutral-900 dark:text-white text-sm">₹{item.total.toLocaleString()}</td>
                                                <td className="p-4 text-center">
                                                    <button className="text-neutral-400 hover:text-rose-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Summary */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-8 border-b border-neutral-100 dark:border-neutral-800 pb-4 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-warning" /> Order Valuation
                            </h2>
                            <div className="space-y-4 text-sm relative z-10">
                                <div className="flex justify-between text-neutral-500 dark:text-neutral-400 font-bold">
                                    <span className="text-[10px] uppercase tracking-widest">Gross Order Value</span>
                                    <span className="font-mono">₹{summary.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-neutral-500 dark:text-neutral-400 font-bold">
                                    <span className="text-[10px] uppercase tracking-widest text-success/70">Aggregate Tax (18%)</span>
                                    <span className="font-mono">₹{summary.tax.toLocaleString()}</span>
                                </div>
                                <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-end mt-8">
                                    <div>
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Total Order Worth</p>
                                        <p className="text-4xl font-display font-black text-neutral-900 dark:text-white tracking-tighter tabular-nums">₹{summary.total.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16"></div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SalesOrderCreatorMockUI;

