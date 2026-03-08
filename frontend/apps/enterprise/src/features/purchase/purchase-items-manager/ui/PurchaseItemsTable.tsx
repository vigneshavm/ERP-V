import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, History, RotateCcw, Package, ChevronsUpDown, Info } from 'lucide-react';
import { PurchaseOrderItem } from "@vignesh-erp/shared-kernel";
import api from "@/shared/api/api";

interface PurchaseItemsTableProps {
    items: PurchaseOrderItem[];
    onUpdate: (index: number, updates: Partial<PurchaseOrderItem>) => void;
    onRemove: (index: number) => void;
    onAdd: (product: any) => void;
    onAddLot: () => void;
    onViewHistory: (product: any) => void;
}

const PurchaseItemsTable: React.FC<PurchaseItemsTableProps> = ({
    items,
    onUpdate,
    onRemove,
    onAdd,
    onAddLot,
    onViewHistory
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Product Search Logic
    useEffect(() => {
        if (!searchTerm) {
            setProducts([]);
            return;
        }
        const delayDebounceFn = setTimeout(async () => {
            try {
                const { data } = await api.get('/api/inventory/search', { params: { query: searchTerm } });
                const list = data.data || data;
                setProducts(Array.isArray(list) ? list : []);
            } catch (err) {
                console.error("Product search failed", err);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Package className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Purchase Inventory</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Managing {items.length} Strategic Items</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:w-80" ref={dropdownRef}>
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Identify product by name or SKU..."
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                        />
                        
                        {showDropdown && products.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50">
                                <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1">
                                    {products.map((p) => (
                                        <button
                                            key={p._id || p.id}
                                            onClick={() => {
                                                onAdd(p);
                                                setSearchTerm('');
                                                setShowDropdown(false);
                                            }}
                                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left group"
                                        >
                                            <div>
                                                <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">{p.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{p.sku || 'No SKU'} • Stock: {p.stock || p.available_stock || 0}</p>
                                            </div>
                                            <div className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500">
                                                ₹{p.cost_price || p.rate || 0}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={onAddLot}
                        className="flex-shrink-0 px-6 py-3 bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Lot
                    </button>
                </div>
            </div>

            <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-2 border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b-2 border-slate-50 dark:border-slate-800">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Product</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">Qty</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32 text-center">Net Rate</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">Tax %</th>
                            <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32 text-right">Line Total</th>
                            <th className="px-6 py-4 w-24"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {items.length > 0 ? (
                            items.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[250px]">{item.product_name}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.sku || 'L-TMP-GEN'}</span>
                                                {item.lot_number && (
                                                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-tighter border border-amber-500/20">
                                                        Lot: {item.lot_number}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <input
                                            type="number"
                                            className="w-full text-center bg-transparent border-none text-sm font-black text-slate-900 dark:text-white focus:ring-0"
                                            value={item.quantity}
                                            onChange={(e) => onUpdate(idx, { quantity: parseFloat(e.target.value) || 0 })}
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-center gap-1 group/rate">
                                            <span className="text-slate-400 font-bold">₹</span>
                                            <input
                                                type="number"
                                                className="w-full max-w-[80px] text-center bg-transparent border-none text-sm font-black text-slate-900 dark:text-white focus:ring-0"
                                                value={item.rate}
                                                onChange={(e) => onUpdate(idx, { rate: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <input
                                            type="number"
                                            className="w-full text-center bg-transparent border-none text-sm font-black text-slate-600 dark:text-slate-400 focus:ring-0"
                                            value={item.tax_percent}
                                            onChange={(e) => onUpdate(idx, { tax_percent: parseFloat(e.target.value) || 0 })}
                                        />
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <span className="text-sm font-black text-indigo-500">₹{item.line_total.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onViewHistory(item)}
                                                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all"
                                                title="View History"
                                            >
                                                <History className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onRemove(idx)}
                                                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                                title="Remove Item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center">
                                    <RotateCcw className="w-12 h-12 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
                                    <p className="text-sm font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Awaiting Inventory Input</p>
                                    <p className="text-xs font-bold text-slate-400 mt-2">Search or add lots to populate the purchase manifest</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PurchaseItemsTable;
