import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Save, Printer, FileText, Search, Plus, Trash2,
    Calendar, User, Truck, CreditCard, ChevronLeft
} from 'lucide-react';
import { RootState } from '../../store';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface PurchaseItem {
    id: string; // temp id
    productId: string;
    productName: string;
    sku: string;
    unitId: string;
    quantity: number;
    rate: number; // cost price
    taxPercent: number;
    taxAmount: number;
    amount: number; // line total (qty * rate + tax?) or just qty * rate? Usually Purchase is exclusive or inclusive. 
    // Let's assume Rate is Basic, + Tax. 
    // PROMPT SAID: "Amount: Auto calculated". usually Qty * Rate. Tax is extra.
}

const PurchaseEntry: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const tenantId = user?.tenantId;
    const branchId = user?.branchId; // Default to user branch

    // Header State
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNo, setInvoiceNo] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    // Items State
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [activeSearchRow, setActiveSearchRow] = useState<number | null>(null);
    const { products } = useSelector((state: RootState) => state.inventory);


    // Summary State
    const [shippingAmount, setShippingAmount] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Derived Totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0); // Need to calc per line
    const grandTotal = subtotal + totalTax + shippingAmount - discountAmount;

    // Fetch Suppliers on Search
    useEffect(() => {
        if (supplierSearch.length > 2) {
            const fetchSuppliers = async () => {
                const { data } = await supabase
                    .from('vendors')
                    .select('id, name, mobile')
                    .ilike('name', `%${supplierSearch}%`)
                    .limit(5);
                if (data) setSuppliers(data);
                setShowSupplierDropdown(true);
            };
            const timer = setTimeout(fetchSuppliers, 300);
            return () => clearTimeout(timer);
        } else {
            setSuppliers([]);
            setShowSupplierDropdown(false);
        }
    }, [supplierSearch]);

    // Add Empty Row
    const addEmptyRow = () => {
        setItems([...items, {
            id: Math.random().toString(36).substr(2, 9),
            productId: '',
            productName: '',
            sku: '',
            unitId: '',
            quantity: 1,
            rate: 0,
            taxPercent: 0,
            taxAmount: 0,
            amount: 0
        }]);
    };

    // Initialize with one row or load PO conversion data
    useEffect(() => {
        const storedPo = localStorage.getItem('pending_po_conversion');
        if (storedPo) {
            try {
                const poData = JSON.parse(storedPo);
                setSupplierId(poData.vendor_id);
                // Fetch vendor name for display
                supabase.from('vendors').select('name').eq('id', poData.vendor_id).single()
                    .then(({ data }) => { if (data) setSupplierName(data.name); });

                // Map items
                const mappedItems: PurchaseItem[] = poData.items.map((i: any) => {
                    const basic = i.quantity * i.rate;
                    const taxAmount = (basic * i.tax) / 100;
                    return {
                        id: Math.random().toString(36).substr(2, 9), // temp id
                        productId: i.productId,
                        productName: 'Loading...', // Ideally we have this or fetch it
                        sku: '',
                        unitId: 'Piece',
                        quantity: i.quantity,
                        rate: i.rate,
                        taxPercent: i.tax,
                        taxAmount: taxAmount,
                        amount: basic + taxAmount - (i.discount || 0)
                    };
                });

                // Fetch product details for names/skus
                const productIds = mappedItems.map(i => i.productId);
                supabase.from('products').select('id, name, sku').in('id', productIds)
                    .then(({ data }) => {
                        if (data) {
                            setItems(prev => prev.map(item => {
                                const p = data.find(d => d.id === item.productId);
                                return p ? { ...item, productName: p.name, sku: p.sku } : item;
                            }));
                        }
                    });

                setItems(mappedItems);
                localStorage.removeItem('pending_po_conversion');
            } catch (e) {
                console.error('Failed to parse PO conversion data', e);
                if (items.length === 0) addEmptyRow();
            }
        } else if (items.length === 0) {
            addEmptyRow();
        }
    }, [items.length]);

    const handleProductSelect = (index: number, product: any) => {
        const newItems = [...items];
        const item = newItems[index];

        item.productId = product.id;
        item.productName = product.name;
        item.sku = product.sku;
        item.unitId = product.unit || 'Piece';
        item.rate = parseFloat(product.cost) || 0;
        item.taxPercent = parseFloat(product.gstPercentage) || 0;

        const basic = item.quantity * item.rate;
        item.taxAmount = (basic * item.taxPercent) / 100;
        item.amount = basic + item.taxAmount;

        newItems[index] = item;
        setItems(newItems);
        setActiveSearchRow(null);
    };

    // Handle Item Change
    const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
        const newItems = [...items];
        const item = { ...newItems[index], [field]: value };

        if (field === 'productName' && item.productId) {
            item.productId = '';
        }

        // Recalculate
        if (field === 'quantity' || field === 'rate' || field === 'taxPercent') {
            const basic = item.quantity * item.rate;
            item.taxAmount = (basic * item.taxPercent) / 100;
            item.amount = basic + item.taxAmount;
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const getFilteredProducts = (query: string) => {
        if (!query || query.length < 2) return [];
        const lower = query.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            (p.sku && p.sku.toLowerCase().includes(lower))
        ).slice(0, 50);
    };

    const handleSave = async (status: 'DRAFT' | 'COMPLETED') => {
        if (!supplierId) return alert('Please select a supplier');
        if (items.filter(i => i.productId).length === 0) return alert('Please add at least one item');

        setIsProcessing(true);
        try {
            const payload = {
                details: {
                    invoice_no: invoiceNo,
                    date: purchaseDate,
                    subtotal,
                    tax_amount: totalTax,
                    discount_amount: discountAmount,
                    shipping_amount: shippingAmount,
                    round_off: 0,
                    total_amount: grandTotal,
                    notes
                },
                items: items.filter(i => i.productId).map(i => ({
                    product_id: i.productId,
                    unit_id: i.unitId, // Need to ensure we have this from product lookup
                    quantity: i.quantity,
                    rate: i.rate,
                    tax_percent: i.taxPercent,
                    tax_amount: i.taxAmount,
                    amount: i.amount
                }))
            };

            const { data, error } = await supabase.rpc('process_purchase_entry', {
                p_purchase_id: null, // New
                p_tenant_id: tenantId,
                p_branch_id: branchId,
                p_vendor_id: supplierId,
                p_details: payload.details,
                p_items: payload.items,
                p_status: status
            });

            if (error) throw error;

            alert(`Purchase ${status === 'DRAFT' ? 'Saved as Draft' : 'Completed Successfully'}! #${data.purchase_number}`);
            navigate('/tenant/purchase'); // Go back to list
        } catch (err: any) {
            console.error(err);
            alert('Error saving purchase: ' + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900 animate-fade-in" onClick={() => setActiveSearchRow(null)}>

            {/* Header */}
            <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-neutral-100 rounded-full">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-neutral-800 dark:text-white">Purchase Entry</h1>
                        <p className="text-sm text-neutral-500">Record supplier purchase & inward stock</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn btn-secondary flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Print
                    </button>
                    <button
                        onClick={() => handleSave('DRAFT')}
                        disabled={isProcessing}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4" /> Save Draft
                    </button>
                    <button
                        onClick={() => handleSave('COMPLETED')}
                        disabled={isProcessing}
                        className="btn btn-primary flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white"
                    >
                        <Save className="w-4 h-4" /> Save Purchase
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Top Panel: Supplier & Meta */}
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Supplier Search */}
                        <div className="relative">
                            <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Supplier</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Search Name / Phone..."
                                    value={supplierName || supplierSearch}
                                    onChange={e => {
                                        setSupplierName('');
                                        setSupplierId('');
                                        setSupplierSearch(e.target.value);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                                />
                                {showSupplierDropdown && suppliers.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 shadow-xl rounded-lg border border-neutral-200 dark:border-neutral-700 z-50 max-h-60 overflow-auto">
                                        {suppliers.map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => {
                                                    setSupplierId(s.id);
                                                    setSupplierName(s.name);
                                                    setSupplierSearch('');
                                                    setShowSupplierDropdown(false);
                                                }}
                                                className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer border-b border-neutral-100 last:border-0"
                                            >
                                                <div className="font-medium text-sm">{s.name}</div>
                                                <div className="text-xs text-neutral-500">{s.mobile}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Invoice No */}
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Supplier Invoice No</label>
                            <input
                                type="text"
                                value={invoiceNo}
                                onChange={e => setInvoiceNo(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                                placeholder="e.g. INV-2024-001"
                            />
                        </div>

                        {/* Date */}
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Purchase Date</label>
                            <input
                                type="date"
                                value={purchaseDate}
                                onChange={e => setPurchaseDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                            />
                        </div>
                    </div>

                    {/* Items Grid */}
                    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400">
                                <tr>
                                    <th className="px-4 py-3 text-left w-12">#</th>
                                    <th className="px-4 py-3 text-left">Item Details</th>
                                    <th className="px-4 py-3 text-right w-24">Qty</th>
                                    <th className="px-4 py-3 text-right w-32">Rate</th>
                                    <th className="px-4 py-3 text-right w-24">Tax %</th>
                                    <th className="px-4 py-3 text-right w-32">Total</th>
                                    <th className="px-4 py-3 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {items.map((item, idx) => (
                                    <tr key={item.id} className="group">
                                        <td className="px-4 py-3 text-neutral-400">{idx + 1}</td>
                                        <td className="px-4 py-3 relative">
                                            <input
                                                type="text"
                                                placeholder="Search Item (Name/SKU)..."
                                                className="w-full bg-transparent outline-none font-medium p-1 border-b border-transparent focus:border-brand-500"
                                                value={item.productName}
                                                onChange={(e) => {
                                                    updateItem(idx, 'productName', e.target.value);
                                                    setActiveSearchRow(idx);
                                                }}
                                                onFocus={() => setActiveSearchRow(idx)}
                                                onClick={e => e.stopPropagation()}
                                            />
                                            {activeSearchRow === idx && item.productName && !item.productId && (
                                                <div className="absolute top-full left-0 w-96 mt-1 bg-white dark:bg-neutral-800 shadow-xl rounded-lg border border-neutral-200 dark:border-neutral-700 z-50 max-h-60 overflow-auto">
                                                    {getFilteredProducts(item.productName).length > 0 ? (
                                                        getFilteredProducts(item.productName).map(p => (
                                                            <div
                                                                key={p.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleProductSelect(idx, p);
                                                                }}
                                                                className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer border-b border-neutral-100 last:border-0"
                                                            >
                                                                <div className="font-medium text-sm">{p.name}</div>
                                                                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                                                                    <span>SKU: {p.sku}</span>
                                                                    <span>Stock: {p.stock}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="p-3 text-neutral-400 text-xs text-center">No products found</div>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="w-full text-right bg-transparent outline-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={item.rate}
                                                onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                                                className="w-full text-right bg-transparent outline-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                value={item.taxPercent}
                                                onChange={e => updateItem(idx, 'taxPercent', parseFloat(e.target.value) || 0)}
                                                className="w-full text-right bg-transparent outline-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            ₹{item.amount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setItems(items.filter((_, i) => i !== idx))}
                                                className="text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan={7} className="px-4 py-3">
                                        <button onClick={addEmptyRow} className="text-brand-600 font-medium text-xs flex items-center gap-1 hover:underline">
                                            <Plus className="w-3 h-3" /> Add Item
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer / Calculations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Notes */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6">
                            <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">Notes / Remarks</label>
                            <textarea
                                rows={4}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm resize-none"
                                placeholder="Enter payment terms, transport details, etc..."
                            />
                        </div>

                        {/* Totals */}
                        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-6 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Subtotal</span>
                                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-neutral-500">Tax Amount</span>
                                <span className="font-medium">₹{totalTax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-neutral-500">Shipping</span>
                                <input
                                    type="number"
                                    value={shippingAmount}
                                    onChange={e => setShippingAmount(parseFloat(e.target.value) || 0)}
                                    className="w-24 text-right p-1 border border-neutral-200 rounded text-sm"
                                />
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-neutral-500">Discount</span>
                                <input
                                    type="number"
                                    value={discountAmount}
                                    onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                    className="w-24 text-right p-1 border border-neutral-200 rounded text-sm text-red-500"
                                />
                            </div>
                            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3 flex justify-between items-center">
                                <span className="text-lg font-bold text-neutral-800 dark:text-white">Total Payable</span>
                                <span className="text-xl font-bold text-brand-600">₹{grandTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseEntry;
