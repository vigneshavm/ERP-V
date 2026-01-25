import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Save, Printer, FileText, Search, Plus, Trash2,
    Calendar, User, Truck, CreditCard, ChevronLeft
} from 'lucide-react';
import { RootState } from '../../redux/store';
import { useNavigate } from 'react-router-dom';
import { usePurchaseItems } from '../../hooks/usePurchaseItems';
import api from '../../services/api';

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
    amount: number; // line total
    // Add additional properties to interface to fix type errors
    line_total?: number; // legacy from hook
    product_name?: string; // legacy from hook
    product_id?: string; // legacy from hook
    tax_percent?: number; // legacy from hook
    discount_amount?: number;
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

    // Items Hook
    const { items, setItems, removeItem, totals } = usePurchaseItems([]);
    const [activeSearchRow, setActiveSearchRow] = useState<number | null>(null);
    const { items: products } = useSelector((state: RootState) => state.inventory);

    const [shippingAmount, setShippingAmount] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [notes, setNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Derived Totals from hook
    const { subtotal, tax: totalTax, discount: discountTotal, total: grandTotalRaw } = totals;
    const grandTotal = grandTotalRaw + shippingAmount - discountAmount; // Apply extra shipping/global discount


    // Fetch Suppliers
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                // Using new API endpoint instead of supabase
                const { data } = await api.get('/suppliers');
                setSuppliers(data || []);
            } catch (err) {
                console.error("Failed to fetch suppliers", err);
            }
        };
        fetchSuppliers();
    }, []);

    // Add Empty Row
    const addEmptyRow = () => {
        setItems(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            product_id: '',
            product_name: '',
            sku: '',
            quantity: 1,
            rate: 0,
            tax_percent: 0,
            discount_amount: 0,
            line_total: 0
        }]);
    };

    // Initialize with one row or load PO conversion data
    useEffect(() => {
        const storedPo = localStorage.getItem('pending_po_conversion');
        if (storedPo) {
            try {
                const poData = JSON.parse(storedPo);
                setSupplierId(poData.vendor_id);
                // Fetch supplier name via API if not in list yet
                api.get(`/suppliers/${poData.vendor_id}`)
                    .then(({ data }) => { if (data) setSupplierName(data.name); })
                    .catch(console.error);

                const mappedItems = poData.items.map((i: any) => {
                    const basic = i.quantity * i.rate;
                    const taxAmount = (basic * i.tax) / 100;
                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        productId: i.productId,
                        productName: 'Loading...',
                        product_name: 'Loading...', // Sync legacy prop
                        sku: '',
                        quantity: i.quantity,
                        rate: i.rate,
                        taxPercent: i.tax,
                        tax_percent: i.tax, // Sync legacy prop
                        discount_amount: i.discount || 0,
                        amount: basic + taxAmount - (i.discount || 0),
                        line_total: basic + taxAmount - (i.discount || 0)
                    };
                });

                // Fetch product details
                // Ideally backend should handle bulk fetch, for now we map individually or simple lookup
                // We'll trust inventory loaded in Redux or fetch specific

                setItems(mappedItems);
                localStorage.removeItem('pending_po_conversion');
            } catch (e) {
                console.error('Failed to parse PO conversion data', e);
                if (items.length === 0) addEmptyRow();
            }
        } else if (items.length === 0) {
            addEmptyRow();
        }
    }, []);

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
        if (items.filter((i: any) => i.productId).length === 0) return alert('Please add at least one item');

        setIsProcessing(true);
        try {
            const payload = {
                details: {
                    invoice_no: invoiceNo,
                    date: purchaseDate,
                    subtotal,
                    tax_amount: totalTax,
                    discount_amount: discountAmount + discountTotal, // Global + Line discounts
                    shipping_amount: shippingAmount,
                    round_off: 0,
                    total_amount: grandTotal,
                    notes
                },
                items: items.filter((i: any) => i.productId).map((i: any) => ({
                    product_id: i.productId,
                    unit_id: 'Piece', // Default or fetch
                    quantity: i.quantity,
                    rate: i.rate,
                    tax_percent: i.taxPercent,
                    tax_amount: (i.quantity * i.rate * i.taxPercent) / 100,
                    amount: i.amount
                })),
                p_vendor_id: supplierId,
                status // Pass status to backend
            };

            const { data } = await api.post('/purchases', payload);

            alert(`Purchase ${status === 'DRAFT' ? 'Saved as Draft' : 'Completed Successfully'}! #${data.purchase_number}`);
            navigate('/tenant/purchase'); // Go back to list
        } catch (err: any) {
            console.error(err);
            alert('Error saving purchase: ' + (err.response?.data?.message || err.message));
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
                                                value={item.product_name}
                                                onChange={(e) => {
                                                    updateItem(idx, 'product_name', e.target.value);
                                                    setActiveSearchRow(idx);
                                                }}
                                                onFocus={() => setActiveSearchRow(idx)}
                                                onClick={e => e.stopPropagation()}
                                            />
                                            {activeSearchRow === idx && item.product_name && !item.product_id && (
                                                <div className="absolute top-full left-0 w-96 mt-1 bg-white dark:bg-neutral-800 shadow-xl rounded-lg border border-neutral-200 dark:border-neutral-700 z-50 max-h-60 overflow-auto">
                                                    {getFilteredProducts(item.product_name).length > 0 ? (
                                                        getFilteredProducts(item.product_name).map(p => (
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
                                                value={item.tax_percent}
                                                onChange={e => updateItem(idx, 'tax_percent', parseFloat(e.target.value) || 0)}
                                                className="w-full text-right bg-transparent outline-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            ₹{item.line_total.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => removeItem(idx)}
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
