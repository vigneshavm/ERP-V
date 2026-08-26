import React, { useState, useMemo } from 'react';
import { Save, X, Plus, FileText, ArrowLeft, Trash2, Box, User, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { inventory, customers, MockProduct, MockCustomer } from '../../../data';
import Layout from '../../../components/shared/Layout';

const SalesReturnMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCustomer, setSelectedCustomer] = useState(customers[0]?.id || '');
    const [lineItems, setLineItems] = useState([
        { id: (inventory as MockProduct[])[0]?.id, qty: 1, rate: (inventory as MockProduct[])[0]?.selling_price || 0 }
    ]);

    const subtotal = useMemo(() => {
        return lineItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    }, [lineItems]);

    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    const addItem = () => {
        setLineItems([...lineItems, { id: (inventory as MockProduct[])[0]?.id, qty: 1, rate: (inventory as MockProduct[])[0]?.selling_price || 0 }]);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const next = [...lineItems];
        if (field === 'id') {
            const product = (inventory as MockProduct[]).find(p => p.id === value);
            next[index] = { ...next[index], id: value, rate: product?.selling_price || 0 };
        } else {
            next[index] = { ...next[index], [field]: value };
        }
        setLineItems(next);
    };

    const removeItem = (index: number) => {
        setLineItems(lineItems.filter((_, i) => i !== index));
    };

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate(-1)} className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:bg-neutral-50 transition-all text-neutral-500">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white">
                                Sales <span className="text-primary">Return</span>
                            </h1>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                                Reverse Sales Protocol // Carbon-Form V2
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => navigate(-1)} className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 transition-all uppercase flex items-center gap-2">
                            <X className="w-4 h-4" /> Discard
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <Save className="w-4 h-4" /> Commit Record
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Form Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Primary Details */}
                        <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400 flex items-center gap-3">
                                <User className="w-4 h-4 text-primary" /> Entity Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Document Authority</label>
                                    <input type="text" className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm p-4 text-xs font-black text-neutral-400 uppercase tracking-widest outline-none" value="SR-AUTO-GEN" disabled />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Processing Date</label>
                                    <input type="date" className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-4 text-xs font-black text-neutral-900 dark:text-white outline-none focus:border-primary transition-all" defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Customer Identity</label>
                                    <select 
                                        value={selectedCustomer}
                                        onChange={(e) => setSelectedCustomer(e.target.value)}
                                        className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-4 text-xs font-black text-neutral-900 dark:text-white outline-none focus:border-primary transition-all uppercase tracking-widest appearance-none cursor-pointer"
                                    >
                                        { (customers as MockCustomer[]).map(c => (
                                            <option key={c.id} value={c.id}>{c.name} // {c.id.split('-').pop()}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400 flex items-center gap-3">
                                    <Box className="w-4 h-4 text-primary" /> Product Manifest
                                </h2>
                                <button onClick={addItem} className="h-10 px-6 bg-primary/10 text-primary border border-primary/20 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Append Line
                                </button>
                            </div>
                            <div className="overflow-x-auto border border-neutral-100 dark:border-neutral-800 rounded-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-100 dark:border-neutral-800">
                                        <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">
                                            <th className="px-6 py-4">Inventory SKU</th>
                                            <th className="px-6 py-4 text-center w-32">Return Qty</th>
                                            <th className="px-6 py-4 text-right w-40">Unit Valuation</th>
                                            <th className="px-6 py-4 text-right w-40">Line Aggregate</th>
                                            <th className="px-6 py-4 text-center w-20"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                                        {lineItems.map((item, idx) => (
                                            <tr key={idx} className="group transition-colors">
                                                <td className="px-6 py-4">
                                                    <select 
                                                        value={item.id}
                                                        onChange={(e) => updateItem(idx, 'id', e.target.value)}
                                                        className="w-full bg-transparent border-none text-xs font-black text-neutral-900 dark:text-white outline-none cursor-pointer uppercase truncate"
                                                    >
                                                        {inventory.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="number" 
                                                        value={item.qty}
                                                        onChange={(e) => updateItem(idx, 'qty', parseInt(e.target.value) || 0)}
                                                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm p-2 text-center text-xs font-black outline-none focus:border-primary transition-all"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-xs font-black text-neutral-400">
                                                    ₹{item.rate.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-xs font-black text-neutral-900 dark:text-white tabular-nums">
                                                    ₹{(item.qty * item.rate).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => removeItem(idx)} className="p-2 text-neutral-300 hover:text-rose-500 transition-colors">
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

                    {/* Summary Card */}
                    <div className="bg-white dark:bg-neutral-900 p-8 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-8 sticky top-8">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-400 flex items-center gap-3">
                            <Calculator className="w-4 h-4 text-primary" /> Financial Audit
                        </h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                <span>Sub-Total Aggregate</span>
                                <span className="font-mono text-xs text-neutral-900 dark:text-white">₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                <span>GST Decomposition (18%)</span>
                                <span className="font-mono text-xs text-neutral-900 dark:text-white">₹{tax.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-4" />
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-white">Net Credit Payable</span>
                                <span className="text-2xl font-display font-black text-primary tabular-nums">₹{total.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-sm space-y-3">
                            <div className="flex items-center gap-2 text-[8px] font-black text-primary uppercase tracking-[0.2em]">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Compliance Check Ready
                            </div>
                            <p className="text-[9px] text-neutral-500 leading-relaxed font-bold">
                                Credit note will be issued against original invoice. Inventory levels will be adjusted upon commitment.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SalesReturnMockUI;

