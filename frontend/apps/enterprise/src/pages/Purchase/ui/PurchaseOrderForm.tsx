
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Save, Trash2, Plus, Search, Copy, MapPin, FileText, Paperclip, X, History, AlertTriangle, Loader2 } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from "@repo/shared-kernel";
import { usePurchaseItems } from "@/hooks/usePurchaseItems";
import { useBranchResolver } from "@/hooks/useBranchResolver";

import api from "@/shared/api/api";

interface Props {
    onBack?: () => void;
    onSave?: (order: Partial<PurchaseOrder>, items: PurchaseOrderItem[]) => Promise<void>;
    initialData?: PurchaseOrder | null;
}

const PurchaseOrderForm: React.FC<Props> = ({ onBack = () => { }, onSave = async () => { }, initialData }) => {
    const { currentBranchId } = useBranchResolver();
    const [header, setHeader] = useState<Partial<PurchaseOrder>>({
        po_date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        notes: '',
        branch_id: currentBranchId || undefined,
        po_number: '', // Will be auto-gen on save if empty, or prefilled
        delivery_location: 'Main Warehouse',
        delivery_address: '',
        reference_number: '',
        terms_and_conditions: 'Standard 30-day payment terms apply. Goods must be delivered in original packaging.',
        approval_status: 'Draft',
        version: 1
    });

    // Templates
    const [showTemplates, setShowTemplates] = useState(false);
    const templates = [
        { name: 'Standard Raw Materials', vendor_id: 'VEND-001', vendor_name: 'Global Supplies', items: [{ product_id: 'P001', product_name: 'Premium Cotton', rate: 120, tax_percent: 5, quantity: 100, line_total: 12600 }] },
        { name: 'Office Stationery', vendor_id: 'VEND-002', vendor_name: 'Metro Office', items: [{ product_id: 'P002', product_name: 'A4 Paper Reams', rate: 450, tax_percent: 12, quantity: 20, line_total: 10080 }] }
    ];

    const termsTemplates = [
        { name: 'Standard 30 Days', content: 'Standard 30-day payment terms apply. Goods must be delivered in original packaging.' },
        { name: 'Advance Payment', content: '50% advance payment required. Remaining on delivery.' },
        { name: 'Net 60', content: 'Payment net 60 days from invoice date.' }
    ];

    // Attachments
    const [attachments, setAttachments] = useState<string[]>([]);
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).map(f => f.name);
            setAttachments(prev => [...prev, ...files]);
        }
    };

    // Vendor Search
    const [vendors, setVendors] = useState<any[]>([]);
    const [vendorSearch, setVendorSearch] = useState('');

    // Items Hook
    const { items, setItems, addItem, updateItem, removeItem, totals } = usePurchaseItems([]);

    // Product Search
    const [products, setProducts] = useState<any[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    // Supplier Status
    const [supplierStatus, setSupplierStatus] = useState<any>(null);
    const [loadingSupplier, setLoadingSupplier] = useState(false);

    // Rate History
    const [historyModal, setHistoryModal] = useState<{ show: boolean, item: string, data: any[], loading: boolean }>({ show: false, item: '', data: [], loading: false });

    // Load Vendors on Mount
    useEffect(() => {
        const loadVendors = async () => {
            try {
                const { data } = await api.get('/suppliers');
                if (data) setVendors(data);
            } catch (err) {
                console.error("Failed to fetch suppliers", err);
            }
        };
        loadVendors();
    }, []);

    // Load Products on Search
    useEffect(() => {
        if (!productSearch) return;
        const search = async () => {
            try {
                // Assuming backend search endpoint or using inventory list
                const { data } = await api.get('/inventory', { params: { search: productSearch } });
                // If the API returns full objects, we might need to map them if structure differs
                if (data) setProducts(data);
            } catch (err) {
                console.error("Failed to search products", err);
            }
        };
        const timeout = setTimeout(search, 300);
        return () => clearTimeout(timeout);
    }, [productSearch]);

    // Check Supplier Status
    useEffect(() => {
        if (!header.vendor_id) {
            setSupplierStatus(null);
            return;
        }
        const checkSupplier = async () => {
            setLoadingSupplier(true);
            try {
                // Fetch analytics for this specific supplier
                const { data } = await api.get(`/suppliers/analytics?supplierId=${header.vendor_id}`);
                if (data && data.success && data.data && data.data.length > 0) {
                    setSupplierStatus(data.data[0]);
                }
            } catch (err) {
                console.error("Failed to check supplier status", err);
            } finally {
                setLoadingSupplier(false);
            }
        };
        const timeout = setTimeout(checkSupplier, 500); // Debounce
        return () => clearTimeout(timeout);
    }, [header.vendor_id]);

    const handleShowHistory = async (itemId: string, itemName: string) => {
        setHistoryModal({ show: true, item: itemName, data: [], loading: true });
        try {
            const { data } = await api.get(`/purchase/history/item/${itemId}`);
            if (data && data.success) {
                setHistoryModal(prev => ({ ...prev, data: data.data, loading: false }));
            }
        } catch (err) {
            console.error("Failed to fetch history", err);
            setHistoryModal(prev => ({ ...prev, loading: false }));
        }
    };

    // Init data
    useEffect(() => {
        if (initialData) {
            setHeader(initialData);
            if (initialData.items) setItems(initialData.items);
        } else {
            // Mock PO Number for display
            const year = new Date().getFullYear();
            const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            setHeader(h => ({ ...h, po_number: `PO-${year}-${rand}` }));
        }
    }, [initialData, setItems]);

    const handleAddItem = (product: any) => {
        addItem(product);
        setProductSearch('');
        setShowProductDropdown(false);
    };

    // Lot Distribution Modal
    const [lotModal, setLotModal] = useState<{ show: boolean, lotNumber: string, totalCost: number, totalQty: number, items: any[] }>({
        show: false, lotNumber: '', totalCost: 0, totalQty: 0, items: []
    });

    const handleAddLot = () => {
        setLotModal({ show: true, lotNumber: '', totalCost: 0, totalQty: 0, items: [] });
    };

    const confirmLotDistribution = () => {
        if (!lotModal.totalQty || !lotModal.totalCost) return;

        const unitRate = parseFloat((lotModal.totalCost / lotModal.totalQty).toFixed(2));

        // Add items to the main list
        const newItems = lotModal.items.map(i => ({
            ...i,
            quantity: i.quantity,
            rate: unitRate,
            amount: i.quantity * unitRate,
            line_total: i.quantity * unitRate, // Ignoring tax for simplicity in this helper, or we should ask tax?
            // Let's assume tax is 0 or same as item default for now, can be edited later
            tax_percent: 0,
            discount_amount: 0,
            discount_percent: 0,
            tax_amount: 0,
            lot_number: lotModal.lotNumber
        }));

        setItems([...items, ...newItems]);
        setLotModal({ ...lotModal, show: false });
    };

    const handleSubmit = async () => {
        if (!header.vendor_id) {
            alert('Please select a supplier');
            return;
        }
        if (items.length === 0) {
            alert('Please add at least one item');
            return;
        }

        // Sanitize header to remove non-DB fields that might have come from initialData
        const { items: _items, vendor_name, ...sanitizedHeader } = header as any;

        await onSave({
            ...sanitizedHeader,
            tax_breakdown: taxBreakdown,
            amount_in_words: amountInWords
        }, items);
    };

    // --- Utilities ---
    const numberToWords = (num: number): string => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const s = num.toString();
        if (s.length > 9) return 'overflow';
        const n: any = ('000000000' + s).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return '';
        let str = '';
        str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
        str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
        str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
        str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
        str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only ' : '';
        return str;
    };

    const taxBreakdown = useMemo(() => {
        // Mock logic: If vendor_id ends in '1', assume intra-state (CGST+SGST), else inter-state (IGST)
        const isIntraState = header.vendor_id?.toString().endsWith('1');
        const totalTax = totals.tax;

        if (isIntraState) {
            return { cgst: totalTax / 2, sgst: totalTax / 2, igst: 0, vat: 0 };
        }
        return { cgst: 0, sgst: 0, igst: totalTax, vat: 0 };
    }, [header.vendor_id, totals.tax]);

    const amountInWords = useMemo(() => numberToWords(Math.round(totals.total)), [totals.total]);


    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            {/* History Modal */}
            {historyModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <History className="w-4 h-4 text-primary" />
                                Price History: {historyModal.item}
                            </h3>
                            <button onClick={() => setHistoryModal(prev => ({ ...prev, show: false }))} className="p-1 hover:bg-neutral-100 rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 max-h-80 overflow-y-auto">
                            {historyModal.loading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                            ) : historyModal.data.length === 0 ? (
                                <p className="text-center text-neutral-500 py-4">No purchase history found.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="text-xs text-neutral-500 bg-neutral-50 dark:bg-neutral-800">
                                        <tr>
                                            <th className="p-2 text-left">Date</th>
                                            <th className="p-2 text-left">Vendor</th>
                                            <th className="p-2 text-right">Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {historyModal.data.map((h, i) => (
                                            <tr key={i}>
                                                <td className="p-2">{new Date(h.date).toLocaleDateString()}</td>
                                                <td className="p-2 text-xs truncate max-w-[100px]" title={h.vendorName}>{h.vendorName}</td>
                                                <td className="p-2 text-right font-medium">₹{h.rate}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-bold">{initialData ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
                    <div className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-[10px] font-bold text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                        Version {header.version || 1}.0
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="px-4 py-2 text-primary hover:bg-primary/5 rounded-lg font-semibold flex items-center gap-2 border border-primary/20"
                    >
                        <Copy className="w-4 h-4" /> {showTemplates ? 'Close Templates' : 'Use Template'}
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-lg hover:bg-primary/90 flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save Order
                    </button>
                </div>
            </div>

            {/* Template Selector */}
            {showTemplates && !initialData && (
                <div className="p-4 bg-primary/5 border-b border-primary/10 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
                    {templates.map((t, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setHeader(h => ({ ...h, vendor_id: t.vendor_id }));
                                setItems(t.items as any);
                                setShowTemplates(false);
                            }}
                            className="text-left p-3 bg-white dark:bg-neutral-800 rounded-xl border border-primary/20 hover:border-primary hover:shadow-md transition-all group"
                        >
                            <div className="font-bold text-sm text-primary group-hover:underline">{t.name}</div>
                            <div className="text-xs text-neutral-500 mt-1">{t.items.length} items • {t.vendor_name}</div>
                        </button>
                    ))}
                </div>
            )}

            {/* Supplier Warning Alert */}
            {supplierStatus && (supplierStatus.overdueCount > 0 || supplierStatus.isCreditRisk) && (
                <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-red-800 dark:text-red-300">Supplier Alert</h4>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                            {supplierStatus.overdueCount > 0 && `This supplier has ${supplierStatus.overdueCount} overdue bills totaling ₹${supplierStatus.overdueAmount?.toFixed(2)}.`}
                            {supplierStatus.isCreditRisk && ` Credit limit exceeded (Usage: ${supplierStatus.creditUtilization?.toFixed(1)}%).`}
                        </p>
                    </div>
                </div>
            )}

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
                                value={header.vendor_id || ''}
                                onChange={e => setHeader({ ...header, vendor_id: e.target.value })}
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 text-sm"
                            >
                                <option value="">Select Vendor</option>
                                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">Delivery Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <select
                                    value={header.delivery_location}
                                    onChange={e => setHeader({ ...header, delivery_location: e.target.value })}
                                    className="w-full pl-8 pr-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="Main Warehouse">Main Warehouse</option>
                                    <option value="Production Unit A">Production Unit A</option>
                                    <option value="Retail Outlet - Center">Retail Outlet - Center</option>
                                    <option value="Third-party Logistics (3PL)">Third-party Logistics (3PL)</option>
                                </select>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">Delivery Address (Specifics)</label>
                            <input
                                type="text"
                                value={header.delivery_address || ''}
                                onChange={e => setHeader({ ...header, delivery_address: e.target.value })}
                                placeholder="Plot no, Street, Landmark..."
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">Reference Number</label>
                            <input
                                type="text"
                                value={header.reference_number || ''}
                                onChange={e => setHeader({ ...header, reference_number: e.target.value })}
                                placeholder="e.g. QUO-2024-001"
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 text-sm"
                            />
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <h3 className="font-bold text-neutral-900 dark:text-white">Order Items</h3>
                                <button
                                    onClick={handleAddLot}
                                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg shadow hover:bg-indigo-700 flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" /> Add Lot
                                </button>
                            </div>
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
                                                onClick={() => handleAddItem(p)}
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

                        {/* Suggestions from History */}
                        {header.vendor_id && (
                            <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                <span className="text-[10px] font-bold text-neutral-400 uppercase whitespace-nowrap">Suggested for this Vendor:</span>
                                {products.slice(0, 3).map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleAddItem(p)}
                                        className="px-3 py-1 bg-primary/5 text-primary text-xs rounded-full border border-primary/20 hover:bg-primary/10 transition-colors whitespace-nowrap"
                                    >
                                        + {p.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-neutral-500">Product</th>
                                        <th className="px-4 py-3 font-semibold text-neutral-500 w-24">Lot #</th>
                                        <th className="px-4 py-3 font-semibold text-neutral-500 w-24">Qty</th>
                                        <th className="px-4 py-3 font-semibold text-neutral-500 w-20">Unit</th>
                                        <th className="px-4 py-3 font-semibold text-neutral-500 w-32">Rate</th>
                                        <th className="px-4 py-3 font-semibold text-neutral-500 w-24">Tax %</th>
                                        <th className="px-4 py-3 font-semibold text-neutral-500 w-24">Disc %</th>
                                        <th className="px-4 py-3 font-semibold text-neutral-500 w-28">Disc Amt</th>
                                        <th className="px-4 py-3 font-semibold text-neutral-500 text-right">Total</th>
                                        <th className="px-4 py-3 w-10"></th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {items.map((item: PurchaseOrderItem, idx: number) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-2 font-medium">{item.product_name}</td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="text"
                                                    placeholder="Lot #"
                                                    value={item.lot_number || ''}
                                                    onChange={e => updateItem(idx, { lot_number: e.target.value })}
                                                    className="w-24 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1 text-xs"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="text"
                                                    value={item.unit || 'pcs'}
                                                    onChange={e => updateItem(idx, { unit: e.target.value })}
                                                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.rate}
                                                    onChange={e => updateItem(idx, { rate: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.tax_percent}
                                                    onChange={e => updateItem(idx, { tax_percent: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={item.discount_percent || 0}
                                                    onChange={e => updateItem(idx, { discount_percent: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded px-2 py-1"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-neutral-500 text-xs">
                                                ₹{item.discount_amount.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-right font-bold">
                                                {item.line_total.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <button
                                                    onClick={() => handleShowHistory(item.product_id || '', item.product_name)}
                                                    className="text-neutral-400 hover:text-primary"
                                                    title="View Price History"
                                                >
                                                    <History className="w-4 h-4" />
                                                </button>
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
                                            <td colSpan={9} className="py-8 text-center text-neutral-400">No items added yet. Search products above.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1 flex items-center gap-1.5">
                                <FileText className="w-3 h-3" /> Notes & Comments
                            </label>
                            <textarea
                                value={header.notes || ''}
                                onChange={e => setHeader({ ...header, notes: e.target.value })}
                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Internal internal notes, internal instructions..."
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-semibold text-neutral-500 uppercase flex items-center gap-1.5">
                                    <FileText className="w-3 h-3 text-emerald-500" /> Terms & Conditions
                                </label>
                                <select
                                    onChange={e => setHeader({ ...header, terms_and_conditions: e.target.value })}
                                    className="text-[10px] bg-transparent border-none text-primary font-bold cursor-pointer focus:ring-0"
                                >
                                    <option value="">Apply Template...</option>
                                    {termsTemplates.map(t => <option key={t.name} value={t.content}>{t.name}</option>)}
                                </select>
                            </div>
                            <textarea
                                value={header.terms_and_conditions || ''}
                                onChange={e => setHeader({ ...header, terms_and_conditions: e.target.value })}
                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                placeholder="External terms, warranty details, payment conditions..."
                            />
                        </div>
                    </div>

                    {/* Attachments Section */}
                    <div className="mt-8">
                        <label className="block text-xs font-semibold text-neutral-500 uppercase mb-3 flex items-center gap-1.5">
                            <Paperclip className="w-3 h-3" /> Attachments (Quotations, Specs)
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {attachments.map((file, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs border border-neutral-200 dark:border-neutral-700 transition-all hover:border-primary/30 group">
                                    <FileText className="w-3 h-3 text-neutral-400" />
                                    <span className="max-w-[120px] truncate">{file}</span>
                                    <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="text-neutral-400 hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            <label className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-neutral-900 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg text-xs text-neutral-400 hover:border-primary/50 hover:text-primary cursor-pointer transition-all">
                                <Plus className="w-3 h-3" />
                                Upload Files
                                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Totals Panel */}
                <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-6 flex flex-col justify-between">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between text-neutral-500">
                            <span>Subtotal</span>
                            <span>₹{totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-neutral-500">
                            <span>Discount</span>
                            <span className="text-green-600">-₹{totals.discount.toFixed(2)}</span>
                        </div>

                        <div className="pt-2 mt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                            <div className="flex justify-between text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                                <span>Tax Breakdown</span>
                                <span>{taxBreakdown.igst > 0 ? 'IGST' : 'CGST+SGST'}</span>
                            </div>
                            {taxBreakdown.cgst > 0 && (
                                <>
                                    <div className="flex justify-between text-neutral-500 text-xs">
                                        <span>CGST (at 50% of total tax)</span>
                                        <span>₹{taxBreakdown.cgst.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-neutral-500 text-xs">
                                        <span>SGST (at 50% of total tax)</span>
                                        <span>₹{taxBreakdown.sgst.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                            {taxBreakdown.igst > 0 && (
                                <div className="flex justify-between text-neutral-500 text-xs">
                                    <span>IGST (100%)</span>
                                    <span>₹{taxBreakdown.igst.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-4" />
                        <div className="flex justify-between text-xl font-bold text-neutral-900 dark:text-white">
                            <span>Total</span>
                            <span>₹{totals.total.toFixed(2)}</span>
                        </div>
                        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <div className="text-[10px] font-bold text-primary uppercase mb-1">Amount in Words</div>
                            <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400 italic font-mono leading-tight">
                                {amountInWords}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setHeader({ ...header, status: 'Draft' })} // Just save as draft
                                className="py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg font-bold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Draft
                            </button>
                            <button
                                onClick={() => alert('PO Sent to Vendor Email!')}
                                className="py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg font-bold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <FileText className="w-4 h-4 text-primary" /> Email PO
                            </button>
                        </div>

                        {/* Operational Actions */}
                        <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="billLater"
                                    checked={header.status === 'RECEIVED'}
                                    onChange={e => setHeader({ ...header, status: e.target.checked ? 'RECEIVED' : 'COMPLETED' })}
                                    className="rounded text-primary focus:ring-primary"
                                />
                                <label htmlFor="billLater" className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                    Urgent: Goods Received, Bill Later
                                </label>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Payment:</label>
                                <select
                                    value={(header as any).payment_method || 'Credit'}
                                    onChange={e => setHeader({ ...header, payment_method: e.target.value } as any)}
                                    className="flex-1 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-2 py-1"
                                >
                                    <option value="Credit">Credit (Standard)</option>
                                    <option value="Cash">Cash (Immediate)</option>
                                    <option value="UPI">UPI / Online</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                // Ensure status is set correctly before submitting
                                // If "Bill Later" is checked, status is RECEIVED. Else COMPLETED.
                                // Defaulting to COMPLETED if not Draft/Received
                                const finalStatus = header.status === 'RECEIVED' ? 'RECEIVED' : 'COMPLETED';
                                onSave({ ...header, status: finalStatus }, items);
                            }}
                            className="w-full py-3 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" /> {header.status === 'RECEIVED' ? 'Receive Goods Only' : 'Complete & Bill'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Lot Distribution Modal */}
            {lotModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Add Lot (Batch)</h3>
                            <button onClick={() => setLotModal({ ...lotModal, show: false })}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Lot Number</label>
                                    <input
                                        type="text"
                                        className="w-full mt-1 p-2 bg-neutral-50 border rounded-lg font-bold"
                                        placeholder="e.g. LOT-2024-001"
                                        value={lotModal.lotNumber}
                                        onChange={e => setLotModal({ ...lotModal, lotNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs font-bold text-neutral-500 uppercase">Total Cost</label>
                                            <input
                                                type="number"
                                                className="w-full mt-1 p-2 bg-neutral-50 border rounded-lg font-bold"
                                                placeholder="0.00"
                                                value={lotModal.totalCost || ''}
                                                onChange={e => setLotModal({ ...lotModal, totalCost: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-neutral-500 uppercase">Total Qty</label>
                                            <input
                                                type="number"
                                                className="w-full mt-1 p-2 bg-neutral-50 border rounded-lg font-bold"
                                                placeholder="0"
                                                value={lotModal.totalQty || ''}
                                                onChange={e => setLotModal({ ...lotModal, totalQty: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-300 flex justify-between">
                                <span>Calculated Unit Rate:</span>
                                <span className="font-bold">
                                    ₹{lotModal.totalQty > 0 ? (lotModal.totalCost / lotModal.totalQty).toFixed(2) : '0.00'} / unit
                                </span>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">Select Items in this Lot</label>
                                <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
                                    <input
                                        type="text"
                                        placeholder="Search products to add..."
                                        className="w-full p-2 mb-2 text-sm border-b"
                                        onChange={async (e) => {
                                            if (e.target.value.length > 2) {
                                                const { data } = await api.get('/inventory', { params: { search: e.target.value } });
                                                if (data) setProducts(data);
                                            }
                                        }}
                                    />
                                    {products.map(p => (
                                        <div key={p.id} className="flex justify-between items-center p-2 hover:bg-neutral-50 cursor-pointer"
                                            onClick={() => {
                                                const existing = lotModal.items.find(i => i.product_id === p.id);
                                                if (existing) return;
                                                setLotModal({
                                                    ...lotModal,
                                                    items: [...lotModal.items, { product_id: p.id, product_name: p.name, quantity: 1 }]
                                                });
                                            }}
                                        >
                                            <span className="text-sm">{p.name}</span>
                                            <Plus className="w-4 h-4 text-neutral-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Selected Items for Lot */}
                            <div className="space-y-2">
                                {lotModal.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-neutral-50 p-2 rounded border">
                                        <span className="flex-1 text-sm font-medium">{item.product_name}</span>
                                        <input
                                            type="number"
                                            className="w-20 p-1 text-sm border rounded"
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const newItems = [...lotModal.items];
                                                newItems[idx].quantity = parseFloat(e.target.value) || 0;
                                                setLotModal({ ...lotModal, items: newItems });
                                            }}
                                        />
                                        <button onClick={() => {
                                            const newItems = lotModal.items.filter((_, i) => i !== idx);
                                            setLotModal({ ...lotModal, items: newItems });
                                        }}><X className="w-4 h-4 text-red-500" /></button>
                                    </div>
                                ))}
                                <div className="text-right text-xs text-neutral-500">
                                    Current Qty Sum: <span className={lotModal.items.reduce((acc, i) => acc + i.quantity, 0) !== lotModal.totalQty ? "text-red-500 font-bold" : "text-green-600 font-bold"}>
                                        {lotModal.items.reduce((acc, i) => acc + i.quantity, 0)}
                                    </span> / {lotModal.totalQty}
                                </div>
                            </div>

                        </div>
                        <div className="p-4 border-t bg-neutral-50 flex justify-end gap-2">
                            <button
                                onClick={() => setLotModal({ ...lotModal, show: false })}
                                className="px-4 py-2 text-neutral-600 font-bold hover:bg-neutral-200 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLotDistribution}
                                disabled={lotModal.items.reduce((acc, i) => acc + i.quantity, 0) !== lotModal.totalQty || lotModal.items.length === 0}
                                className="px-4 py-2 bg-primary text-white font-bold rounded-lg disabled:opacity-50"
                            >
                                Distribute & Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseOrderForm;
