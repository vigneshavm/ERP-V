import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Save, Printer, FileText, Search, Plus, Trash2,
    Calendar, User, Truck, CreditCard, ChevronLeft
} from 'lucide-react';
import { RootState } from "../../../redux/store";
import { useNavigate } from 'react-router-dom';
import { usePurchaseItems } from "../../../hooks/usePurchaseItems";
import api from "../../../services/api.js";
import { printBarcodeLabels } from "../../../utils/labelPrinter";
import Layout from "../../../components/shared/Layout";
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

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
    margin?: number;
    sellingPrice?: number;
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
    const [showDesignSetModal, setShowDesignSetModal] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    // Design Set Temp State
    const [designSet, setDesignSet] = useState({
        name: '',
        category: null as any,
        colors: [''],
        sizes: [''],
        rate: 0,
        margin: 0,
        sellingPrice: 0,
        taxPercent: 0,
        washingInstructions: ''
    });

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/inventory/categories');
                // The API returns { success, data: [], ... }
                setCategories(data?.data || []);
            } catch (err) {
                console.error("Failed to fetch categories", err);
            }
        };
        fetchCategories();
    }, []);

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
            line_total: 0,
            margin: 0,
            sellingPrice: 0
        }]);
    };

    // Expand Design Set
    const expandDesignSet = () => {
        if (!designSet.name || !designSet.category) return toast.error('Name and Category are required');

        const newExpandedItems: any[] = [];
        designSet.colors.filter(c => c.trim()).forEach(color => {
            designSet.sizes.filter(s => s.trim()).forEach(size => {
                newExpandedItems.push({
                    id: Math.random().toString(36).substr(2, 9),
                    product_id: 'new', // Flag for backend to create item
                    product_name: `${designSet.name} - ${color} / ${size}`,
                    category_name: designSet.category.name,
                    category_code: designSet.category.shortCode || 'CAT',
                    sku: '', // Backend will generate SUP-CAT-PRICE
                    quantity: 1,
                    rate: designSet.rate,
                    tax_percent: designSet.taxPercent,
                    discount_amount: 0,
                    margin: designSet.margin,
                    sellingPrice: designSet.sellingPrice,
                    color,
                    size,
                    line_total: designSet.rate + (designSet.rate * designSet.taxPercent / 100)
                });
            });
        });

        // Filter out empty rows before adding
        setItems(prev => [...prev.filter(i => i.product_name), ...newExpandedItems]);
        setShowDesignSetModal(false);
        // Reset modal
        setDesignSet({
            name: '',
            category: null,
            colors: [''],
            sizes: [''],
            rate: 0,
            margin: 0,
            sellingPrice: 0,
            taxPercent: 0,
            washingInstructions: ''
        });
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

    const handleSave = async (status: 'DRAFT' | 'COMPLETED', overrideOptions: any = {}) => {
        if (!supplierId) return alert('Please select a supplier');
        if (items.filter((i: any) => i.product_id || i.product_name).length === 0) return alert('Please add at least one item');

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
                items: items.filter((i: any) => i.product_id || i.product_name).map((i: any) => ({
                    product_id: i.product_id,
                    product_name: i.product_name,
                    category_name: i.category_name,
                    category_code: i.category_code,
                    unit_id: 'Piece', // Default or fetch
                    quantity: i.quantity,
                    rate: i.rate,
                    tax_percent: i.tax_percent || i.taxPercent,
                    tax_amount: (i.quantity * i.rate * (i.tax_percent || i.taxPercent || 0)) / 100,
                    amount: i.amount,
                    margin: i.margin || 0,
                    selling_price: i.sellingPrice || 0,
                    color: i.color,
                    size: i.size,
                    sku: i.sku
                })),
                p_vendor_id: supplierId,
                status, // Pass status to backend
                ...overrideOptions
            };

            const { data } = await api.post('/purchases', payload);

            toast.success(`Purchase ${status === 'DRAFT' ? 'Saved as Draft' : 'Completed Successfully'}! #${data.purchase_number}`);
            navigate('/tenant/purchase'); // Go back to list
        } catch (err: any) {
            console.error(err);
            const code = err.response?.data?.code;
            if (code === 'CREDIT_LIMIT_EXCEEDED' || code === 'CREDIT_PERIOD_EXCEEDED') {
                const reason = err.response?.data?.message || 'Supplier Limit Reached';
                const promiseDate = prompt(`⚠️ SUPPLIER CREDIT LOCKOUT\n\n${reason}\n\nMANAGER ACTION: Enter Payment Promise Date (YYYY-MM-DD) to bypass:`);
                if (promiseDate) {
                    setIsProcessing(false);
                    await handleSave(status, { paymentPromiseDate: promiseDate });
                    return;
                }
            }
            toast.error('Error saving purchase: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Layout>
            <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900 animate-fade-in" onClick={() => setActiveSearchRow(null)}>

                {/* Design Set Modal */}
                {showDesignSetModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center bg-purple-50 dark:bg-purple-900/30">
                                <h2 className="text-lg font-bold text-purple-800 dark:text-purple-200">Add Design Set</h2>
                                <button onClick={() => setShowDesignSetModal(false)} className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 text-xl">&times;</button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Base Name</label>
                                        <input
                                            type="text"
                                            value={designSet.name}
                                            onChange={e => setDesignSet({ ...designSet, name: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                                            placeholder="e.g. Silk Saree"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Category</label>
                                        <select
                                            onChange={e => {
                                                const cat = categories.find(c => c.id === e.target.value);
                                                setDesignSet({ ...designSet, category: cat });
                                            }}
                                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Colors (Comma separated)</label>
                                        <input
                                            type="text"
                                            value={designSet.colors.join(', ')}
                                            onChange={e => setDesignSet({ ...designSet, colors: e.target.value.split(',').map(s => s.trim()) })}
                                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                                            placeholder="Red, Blue, Green"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Sizes (Comma separated)</label>
                                        <input
                                            type="text"
                                            value={designSet.sizes.join(', ')}
                                            onChange={e => setDesignSet({ ...designSet, sizes: e.target.value.split(',').map(s => s.trim()) })}
                                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                                            placeholder="S, M, L, XL"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Cost Price</label>
                                        <input
                                            type="number"
                                            value={designSet.rate}
                                            onChange={e => setDesignSet({ ...designSet, rate: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Margin %</label>
                                        <input
                                            type="number"
                                            value={designSet.margin}
                                            onChange={e => {
                                                const margin = parseFloat(e.target.value) || 0;
                                                setDesignSet({ ...designSet, margin, sellingPrice: designSet.rate * (1 + margin / 100) });
                                            }}
                                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Selling Price</label>
                                        <input
                                            type="number"
                                            value={designSet.sellingPrice}
                                            onChange={e => {
                                                const sp = parseFloat(e.target.value) || 0;
                                                setDesignSet({ ...designSet, sellingPrice: sp, margin: designSet.rate > 0 ? ((sp / designSet.rate) - 1) * 100 : 0 });
                                            }}
                                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-brand-600 font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Tax %</label>
                                        <input
                                            type="number"
                                            value={designSet.taxPercent}
                                            onChange={e => setDesignSet({ ...designSet, taxPercent: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Washing Instructions</label>
                                    <input
                                        type="text"
                                        value={designSet.washingInstructions}
                                        onChange={e => setDesignSet({ ...designSet, washingInstructions: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                                        placeholder="e.g. Dry Clean Only, Hand Wash"
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 flex justify-end gap-3">
                                <button onClick={() => setShowDesignSetModal(false)} className="btn btn-secondary btn-interactive">Cancel</button>
                                <button
                                    onClick={expandDesignSet}
                                    className="btn btn-primary bg-purple-600 hover:bg-purple-700 text-white px-6 btn-interactive"
                                >
                                    Generate Variants ({designSet.colors.filter(c => c.trim()).length * designSet.sizes.filter(s => s.trim()).length} rows)
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-neutral-100 rounded-full">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-neutral-800 dark:text-white">Purchase Entry</h1>
                            <p className="text-sm text-secondary">Record supplier purchase & inward stock</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                const labelItems = items
                                    .filter(i => i.product_name || i.productName)
                                    .map(i => {
                                        const supplier = suppliers.find(s => s.id === supplierId);
                                        const supCode = supplier?.shortCode || 'SUP';
                                        const catCode = i.category_code || 'CAT';
                                        const sku = i.sku || `${supCode}-${catCode}-${i.sellingPrice || 0}`;

                                        return {
                                            productName: i.product_name || i.productName,
                                            sku: sku,
                                            sellingPrice: i.sellingPrice || 0,
                                            size: i.size,
                                            color: i.color,
                                            washingInstructions: i.washingInstructions || i.washing_instructions
                                        };
                                    });
                                if (labelItems.length === 0) return toast.info('No items to print');
                                printBarcodeLabels(labelItems);
                            }}
                            className="btn btn-secondary flex items-center gap-2 btn-interactive"
                        >
                            <Printer className="w-4 h-4" /> Print Labels
                        </button>
                        <button
                            onClick={() => handleSave('DRAFT')}
                            disabled={isProcessing}
                            className="btn btn-secondary flex items-center gap-2 btn-interactive"
                        >
                            <FileText className="w-4 h-4" /> Save Draft
                        </button>
                        <button
                            onClick={() => handleSave('COMPLETED')}
                            disabled={isProcessing}
                            className="btn btn-primary flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white btn-interactive shadow-lg shadow-brand-500/20"
                        >
                            <Save className="w-4 h-4" /> Save Purchase
                        </button>
                    </div>
                </div>

                {isProcessing && (
                    <div className="fixed inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[2px] z-[200] flex flex-col items-center justify-center animate-fade-in">
                        <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
                            <p className="font-bold text-neutral-800 dark:text-neutral-200">Processing Purchase...</p>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* Top Panel: Supplier & Meta */}
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border border-neutral-200 dark:border-neutral-700/50">
                            {/* Supplier Search */}
                            <div className="relative">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1.5 block tracking-wider">Supplier</label>
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
                                                    <div className="text-xs text-muted">{s.mobile}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Invoice No */}
                            <div>
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1.5 block tracking-wider">Supplier Invoice No</label>
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
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-1.5 block tracking-wider">Purchase Date</label>
                                <input
                                    type="date"
                                    value={purchaseDate}
                                    onChange={e => setPurchaseDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                                />
                            </div>
                        </div>

                        {/* Items Grid */}
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm overflow-hidden border border-neutral-200 dark:border-neutral-700/50">
                            <table className="w-full text-sm">
                                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left w-12">#</th>
                                        <th className="px-4 py-3 text-left">Item Details</th>
                                        <th className="px-4 py-3 text-right w-24">Qty</th>
                                        <th className="px-4 py-3 text-right w-32">Rate</th>
                                        <th className="px-4 py-3 text-right w-24">Tax %</th>
                                        <th className="px-4 py-3 text-right w-24">Margin %</th>
                                        <th className="px-4 py-3 text-right w-32">Selling Price</th>
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
                                                                        <span>Stock: {p.stockQty}</span>
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
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.margin || 0}
                                                    onChange={e => {
                                                        const margin = parseFloat(e.target.value) || 0;
                                                        const sellingPrice = item.rate * (1 + margin / 100);
                                                        const newItems = [...items];
                                                        newItems[idx] = { ...item, margin, sellingPrice };
                                                        setItems(newItems);
                                                    }}
                                                    className="w-full text-right bg-transparent outline-none text-brand-600 font-bold"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={item.sellingPrice || 0}
                                                    onChange={e => {
                                                        const sellingPrice = parseFloat(e.target.value) || 0;
                                                        const margin = item.rate > 0 ? ((sellingPrice / item.rate) - 1) * 100 : 0;
                                                        const newItems = [...items];
                                                        newItems[idx] = { ...item, sellingPrice, margin };
                                                        setItems(newItems);
                                                    }}
                                                    className="w-full text-right bg-transparent outline-none text-success-600 font-bold"
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
                                    <td colSpan={9} className="px-4 py-3">
                                        <div className="flex gap-4">
                                            <button onClick={addEmptyRow} className="text-brand-600 font-medium text-xs flex items-center gap-1 hover:underline">
                                                <Plus className="w-3 h-3" /> Add Item
                                            </button>
                                            <button
                                                onClick={() => setShowDesignSetModal(true)}
                                                className="text-purple-600 font-medium text-xs flex items-center gap-1 hover:underline"
                                            >
                                                <Plus className="w-3 h-3" /> Add Design Set
                                            </button>
                                        </div>
                                    </td>
                                </tbody>
                            </table>
                        </div>

                        {/* Footer / Calculations */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Notes */}
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm p-6 border border-neutral-200 dark:border-neutral-700/50">
                                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase mb-2.5 block tracking-wider">Notes / Remarks</label>
                                <textarea
                                    rows={4}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-sm resize-none"
                                    placeholder="Enter payment terms, transport details, etc..."
                                />
                            </div>

                            {/* Totals */}
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm p-6 space-y-3 border border-neutral-200 dark:border-neutral-700/50">
                                <div className="flex justify-between text-sm">
                                    <span className="text-secondary">Subtotal</span>
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
        </Layout>
    );
};

export default PurchaseEntry;
