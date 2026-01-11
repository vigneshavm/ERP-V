
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Trash2, Plus, Search } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from '../../../hooks/usePurchaseOrders';
import { useBranchResolver } from '../../../hooks/useBranchResolver';
import { supabase } from '../../../lib/supabase';

interface Props {
    onBack: () => void;
    onSave: (order: Partial<PurchaseOrder>, items: PurchaseOrderItem[]) => Promise<void>;
    initialData?: PurchaseOrder | null;
}

const PurchaseOrderForm: React.FC<Props> = ({ onBack, onSave, initialData }) => {
    const { currentBranchId } = useBranchResolver();
    const [header, setHeader] = useState<Partial<PurchaseOrder>>({
        po_date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        notes: '',
        branch_id: currentBranchId,
        po_number: '' // Will be auto-gen on save if empty, or prefilled
    });

    // Vendor Search
    const [vendors, setVendors] = useState<any[]>([]);
    const [vendorSearch, setVendorSearch] = useState('');

    // Items
    const [items, setItems] = useState<PurchaseOrderItem[]>([]);

    // Product Search
    const [products, setProducts] = useState<any[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    // Load Vendors on Mount
    useEffect(() => {
        const loadVendors = async () => {
            const { data } = await supabase.from('vendors').select('id, name');
            if (data) setVendors(data);
        };
        loadVendors();
    }, []);

    // Load Products on Search
    useEffect(() => {
        if (!productSearch) return;
        const search = async () => {
            const { data } = await supabase
                .from('products')
                .select('*')
                .ilike('name', `%${productSearch}%`)
                .limit(10);
            if (data) setProducts(data);
        };
        const timeout = setTimeout(search, 300);
        return () => clearTimeout(timeout);
    }, [productSearch]);

    // Init data
    useEffect(() => {
        if (initialData) {
            setHeader(initialData);
            // Items are fetched separately in hook usually, but let's assume passed or fetch here
            // For MVP assuming initialData came with items (fetched by detail view before edit)
            if (initialData.items) setItems(initialData.items);
        } else {
            // Mock PO Number for display
            const year = new Date().getFullYear();
            const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            setHeader(h => ({ ...h, po_number: `PO-${year}-${rand}` }));
        }
    }, [initialData]);

    const addItem = (product: any) => {
        setItems(prev => [...prev, {
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            rate: product.cost_price || 0,
            tax_percent: 0,
            discount_amount: 0,
            line_total: product.cost_price || 0
        }]);
        setProductSearch('');
        setShowProductDropdown(false);
    };

    const updateItem = (index: number, field: 'quantity' | 'rate' | 'tax_percent' | 'discount_amount', value: number) => {
        setItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[index], [field]: value };

            // Recalculate line total
            const base = item.quantity * item.rate;
            const tax = base * (item.tax_percent / 100);
            item.line_total = base + tax - item.discount_amount;

            newItems[index] = item;
            return newItems;
        });
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, i) => sum + (i.quantity * i.rate), 0);
        const tax = items.reduce((sum, i) => sum + ((i.quantity * i.rate) * (i.tax_percent / 100)), 0);
        const discount = items.reduce((sum, i) => sum + i.discount_amount, 0);
        return { subtotal, tax, discount, total: subtotal + tax - discount };
    };

    const totals = calculateTotals();

    const handleSubmit = async () => {
        if (!header.supplier_id) {
            alert('Please select a supplier');
            return;
        }
        if (items.length === 0) {
            alert('Please add at least one item');
            return;
        }

        // Sanitize header to remove non-DB fields that might have come from initialData
        const { items: _items, vendor_name, vendors, ...sanitizedHeader } = header as any;

        await onSave(sanitizedHeader, items);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold">{initialData ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
                </div>
                <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-lg hover:bg-primary/90 flex items-center gap-2"
                >
                    <Save className="w-4 h-4" /> Save Order
                </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Scrollable Form Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {/* Top Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">PO Number</label>
                            <input
                                type="text"
                                value={header.po_number}
                                disabled
                                className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 font-mono text-sm opacity-70"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">Date</label>
                            <input
                                type="date"
                                value={header.po_date}
                                onChange={e => setHeader({ ...header, po_date: e.target.value })}
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">Expected By</label>
                            <input
                                type="date"
                                value={header.expected_delivery || ''}
                                onChange={e => setHeader({ ...header, expected_delivery: e.target.value })}
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">Supplier</label>
                            <select
                                value={header.supplier_id || ''}
                                onChange={e => setHeader({ ...header, supplier_id: e.target.value })}
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 text-sm"
                            >
                                <option value="">Select Vendor</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-neutral-900 dark:text-white">Order Items</h3>
                            <div className="relative w-64">
                                <input
                                    type="text"
                                    placeholder="Add Product..."
                                    value={productSearch}
                                    onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                                    className="w-full pl-8 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                {showProductDropdown && products.length > 0 && (
                                    <div className="absolute top-full mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                                        {products.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => addItem(p)}
                                                className="w-full text-left px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm"
                                            >
                                                <div className="font-medium">{p.name}</div>
                                                <div className="text-xs text-neutral-500">Stock: {p.stock || 0}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-neutral-500">Product</th>
                                        <th className="px-4 py-3 font-semibold text-neutral-500 w-24">Qty</th>
                                        <th className="px-4 py-3 font-semibold text-neutral-500 w-32">Rate</th>
                                        <th className="px-4 py-3 font-semibold text-neutral-500 w-24">Tax %</th>
                                        <th className="px-4 py-3 font-semibold text-neutral-500 w-24">Disc</th>
                                        <th className="px-4 py-3 font-semibold text-neutral-500 text-right">Total</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-2 font-medium">{item.product_name}</td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.rate}
                                                    onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.tax_percent}
                                                    onChange={e => updateItem(idx, 'tax_percent', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.discount_amount}
                                                    onChange={e => updateItem(idx, 'discount_amount', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-right font-bold">
                                                {item.line_total.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <button onClick={() => removeItem(idx)} className="text-neutral-400 hover:text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-neutral-400">No items added yet. Search products above.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">Notes</label>
                        <textarea
                            value={header.notes || ''}
                            onChange={e => setHeader({ ...header, notes: e.target.value })}
                            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 text-sm h-24"
                            placeholder="Terms of delivery, payment instructions, etc."
                        />
                    </div>
                </div>

                {/* Totals Panel */}
                <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-6 flex flex-col justify-end">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-neutral-500">
                            <span>Subtotal</span>
                            <span>₹{totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-neutral-500">
                            <span>Tax</span>
                            <span>₹{totals.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-neutral-500">
                            <span>Discount</span>
                            <span className="text-green-600">-₹{totals.discount.toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-4" />
                        <div className="flex justify-between text-xl font-bold text-neutral-900 dark:text-white">
                            <span>Total</span>
                            <span>₹{totals.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrderForm;
