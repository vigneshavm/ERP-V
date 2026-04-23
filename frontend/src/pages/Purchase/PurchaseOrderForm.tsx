import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Save, Trash2, Plus, Search, Copy, MapPin, FileText, Paperclip, X, History, AlertTriangle, Loader2, Info, ChevronDown, CheckCircle2, Package, Truck, CreditCard, Zap } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from "../../types/purchase";
import { usePurchaseItems } from "../../hooks/usePurchaseItems";
import { useBranchResolver } from "../../hooks/useBranchResolver";
import PageHeader from "../../components/shared/Layout/PageHeader";
import api from "../../services/api";

interface Props {
    onBack?: () => void;
    onSave?: (order: Partial<PurchaseOrder>, items: PurchaseOrderItem[]) => Promise<void>;
    initialData?: PurchaseOrder | null;
}

const PurchaseOrderForm: React.FC<Props> = ({ onBack = () => { }, onSave = async () => { }, initialData }) => {
    const { currentBranchId } = useBranchResolver();
    const [isSaving, setIsSaving] = useState(false);
    const [header, setHeader] = useState<Partial<PurchaseOrder>>({
        po_date: new Date().toISOString().split('T')[0],
        status: 'Draft',
        notes: '',
        branch_id: currentBranchId || undefined,
        po_number: '',
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
                if (data) {
                    const vendorList = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);
                    setVendors(vendorList);
                }
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
                const { data } = await api.get('/inventory', { params: { search: productSearch } });
                if (data) {
                    const productList = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);
                    setProducts(productList);
                }
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
        const timeout = setTimeout(checkSupplier, 500);
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

    const handleSubmit = async () => {
        if (!header.vendor_id) {
            alert('Please select a supplier');
            return;
        }
        if (items.length === 0) {
            alert('Please add at least one item');
            return;
        }

        setIsSaving(true);
        try {
            const { items: _items, vendor_name, ...sanitizedHeader } = header as any;
            await onSave({
                ...sanitizedHeader,
                tax_breakdown: taxBreakdown,
                amount_in_words: amountInWords
            }, items);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Utilities ---
    const numberToWords = (num: number): string => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const s = num.toString();
        if (s.length > 9) return 'overflow';
        let n: any = ('000000000' + s).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
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
        const isIntraState = header.vendor_id?.toString().endsWith('1');
        const totalTax = totals.tax;
        if (isIntraState) {
            return { cgst: totalTax / 2, sgst: totalTax / 2, igst: 0, vat: 0 };
        }
        return { cgst: 0, sgst: 0, igst: totalTax, vat: 0 };
    }, [header.vendor_id, totals.tax]);

    const amountInWords = useMemo(() => numberToWords(Math.round(totals.total)), [totals.total]);

    return (
        <div className="flex flex-col h-screen bg-neutral-50 dark:bg-neutral-900">
            {/* History Modal */}
            {historyModal.show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-neutral-200 dark:border-neutral-700 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
                            <h3 className="text-sm font-black flex items-center gap-3 uppercase tracking-widest">
                                <History className="w-5 h-5 text-primary" /> Price History: <span className="text-primary">{historyModal.item}</span>
                            </h3>
                            <button onClick={() => setHistoryModal(prev => ({ ...prev, show: false }))} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-all">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-8 max-h-96 overflow-y-auto custom-scrollbar">
                            {historyModal.loading ? (
                                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                            ) : historyModal.data.length === 0 ? (
                                <div className="text-center py-12 opacity-40">
                                    <Info className="w-12 h-12 mx-auto mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">No node history found.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="pb-4">Fiscal Date</th>
                                            <th className="pb-4">Vendor</th>
                                            <th className="pb-4 text-right">Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                        {historyModal.data.map((h, i) => (
                                            <tr key={i} className="group">
                                                <td className="py-4 text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter tabular-nums">{new Date(h.date).toLocaleDateString()}</td>
                                                <td className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest truncate max-w-[120px]">{h.vendorName}</td>
                                                <td className="py-4 text-right text-xs font-black text-primary tabular-nums">₹{h.rate}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <PageHeader
                title={initialData ? 'Refactor Order' : 'Institutional Order'}
                description="Initialize procurement nodes with verified supply-chain parameters."
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95"
                        >
                            <Copy className="w-4 h-4 text-primary" /> {showTemplates ? 'Cancel Template' : 'Use Template'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Node
                        </button>
                    </div>
                }
                breadcrumbs={[
                    { label: 'Procurement', link: '/purchase' },
                    { label: 'Orders', link: '/purchase/orders' },
                    { label: initialData ? 'Refactor' : 'New' }
                ]}
            />

            {/* Template Selector */}
            {showTemplates && !initialData && (
                <div className="mx-8 mt-6 p-6 bg-primary/5 border border-primary/10 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
                    {templates.map((t, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setHeader(h => ({ ...h, vendor_id: t.vendor_id }));
                                setItems(t.items as any);
                                setShowTemplates(false);
                            }}
                            className="text-left p-6 bg-white dark:bg-neutral-800 rounded-3xl border border-primary/20 hover:border-primary hover:shadow-xl transition-all group"
                        >
                            <div className="font-black text-xs text-primary uppercase tracking-widest group-hover:underline">{t.name}</div>
                            <div className="text-[10px] font-bold text-neutral-400 mt-2 uppercase tracking-widest">{t.items.length} Nodes • {t.vendor_name}</div>
                        </button>
                    ))}
                </div>
            )}

            {/* Supplier Warning Node */}
            {supplierStatus && (supplierStatus.overdueCount > 0 || supplierStatus.isCreditRisk) && (
                <div className="mx-8 mt-6 p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 rounded-[2.5rem] flex items-center gap-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-rose-800 dark:text-rose-400 uppercase tracking-widest">Supplier Risk Surveillance</h4>
                        <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-1 italic leading-relaxed">
                            {supplierStatus.overdueCount > 0 && `Institutional overdue detected: ${supplierStatus.overdueCount} bills totaling ₹${supplierStatus.overdueAmount?.toFixed(2)}.`}
                            {supplierStatus.isCreditRisk && ` Credit utilization threshold breached (${supplierStatus.creditUtilization?.toFixed(1)}%).`}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-8 gap-8">
                {/* Scrollable Form Arena */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-10 pr-4">
                    {/* Primary Params Group */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Node Protocol #</label>
                            <div className="px-5 py-3 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs font-black text-neutral-500 font-mono tracking-tighter opacity-70">
                                {header.po_number}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Fiscal Date</label>
                            <input
                                type="date"
                                value={header.po_date}
                                onChange={e => setHeader({ ...header, po_date: e.target.value })}
                                className="w-full px-5 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">ETA Constraint</label>
                            <input
                                type="date"
                                value={header.expected_delivery || ''}
                                onChange={e => setHeader({ ...header, expected_delivery: e.target.value })}
                                className="w-full px-5 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Institutional Vendor</label>
                            <select
                                value={header.vendor_id || ''}
                                onChange={e => setHeader({ ...header, vendor_id: e.target.value })}
                                className="w-full px-5 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            >
                                <option value="">Select entity...</option>
                                {Array.isArray(vendors) && vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Logistics Group */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Supply Hub</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <select
                                    value={header.delivery_location}
                                    onChange={e => setHeader({ ...header, delivery_location: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none appearance-none"
                                >
                                    <option value="Main Warehouse">Main Warehouse</option>
                                    <option value="Production Unit A">Production Unit A</option>
                                    <option value="Retail Outlet - Center">Retail Outlet - Center</option>
                                    <option value="Third-party Logistics (3PL)">Third-party Logistics (3PL)</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Coordinate Precision (Address)</label>
                            <input
                                type="text"
                                value={header.delivery_address || ''}
                                onChange={e => setHeader({ ...header, delivery_address: e.target.value })}
                                placeholder="Plot, Sector, Landmark..."
                                className="w-full px-5 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Ref Oracle ID</label>
                            <input
                                type="text"
                                value={header.reference_number || ''}
                                onChange={e => setHeader({ ...header, reference_number: e.target.value })}
                                placeholder="e.g. QUO-2024-X"
                                className="w-full px-5 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xs font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Inventory Node Table */}
                    <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-neutral-100 dark:border-neutral-700 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-sm font-black uppercase tracking-widest">Inventory Nodes</h3>
                                <button
                                    onClick={handleAddLot}
                                    className="px-4 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2 hover:bg-indigo-100 transition-all"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Bulk Lot
                                </button>
                            </div>
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Add SKU node..."
                                    value={productSearch}
                                    onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                                    className="w-full pl-12 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                                {showProductDropdown && products.length > 0 && (
                                    <div className="absolute top-full mt-3 w-full bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-2xl shadow-2xl z-[55] overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        {products.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleAddItem(p)}
                                                className="w-full text-left px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-700 border-b border-neutral-50 dark:border-neutral-700 last:border-none transition-colors"
                                            >
                                                <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter">{p.name}</p>
                                                <p className="text-[10px] font-black text-neutral-400 mt-1 uppercase tracking-widest">Vault Stock: {p.stock || 0} {p.unit || 'pcs'}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-700">
                                    <tr>
                                        <th className="px-8 py-5">Product SKU</th>
                                        <th className="px-8 py-5 w-24">Lot #</th>
                                        <th className="px-8 py-5 w-28 text-center">Quantity</th>
                                        <th className="px-8 py-5 w-24 text-center">Unit</th>
                                        <th className="px-8 py-5 w-32 text-right">Rate</th>
                                        <th className="px-8 py-5 w-20 text-center">Tax %</th>
                                        <th className="px-8 py-5 w-32 text-right">Node Total</th>
                                        <th className="px-8 py-5 w-16 text-center">Info</th>
                                        <th className="px-8 py-5 w-16 text-center">Del</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-all">
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter">{item.product_name}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <input
                                                    type="text"
                                                    value={item.lot_number || ''}
                                                    onChange={e => updateItem(idx, 'lot_number', e.target.value)}
                                                    className="w-20 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-primary/20 outline-none"
                                                    placeholder="LOT-X"
                                                />
                                            </td>
                                            <td className="px-8 py-5">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-lg px-3 py-1.5 text-xs font-black text-center tabular-nums focus:ring-1 focus:ring-primary/20 outline-none"
                                                />
                                            </td>
                                            <td className="px-8 py-5">
                                                <input
                                                    type="text"
                                                    value={item.unit || 'pcs'}
                                                    onChange={e => updateItem(idx, 'unit', e.target.value)}
                                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-center focus:ring-1 focus:ring-primary/20 outline-none"
                                                />
                                            </td>
                                            <td className="px-8 py-5">
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-lg px-3 py-1.5 text-xs font-black text-right tabular-nums focus:ring-1 focus:ring-primary/20 outline-none"
                                                />
                                            </td>
                                            <td className="px-8 py-5">
                                                <input
                                                    type="number"
                                                    value={item.tax_percent}
                                                    onChange={e => updateItem(idx, 'tax_percent', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-lg px-2 py-1.5 text-[10px] font-black text-center tabular-nums focus:ring-1 focus:ring-primary/20 outline-none"
                                                />
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-xs text-neutral-900 dark:text-white tabular-nums">
                                                ₹{item.line_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <button onClick={() => handleShowHistory(item.product_id || '', item.product_name)} className="p-2 text-neutral-300 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                                                    <History className="w-4 h-4" />
                                                </button>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <button onClick={() => removeItem(idx)} className="p-2 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="py-24 text-center opacity-30">
                                                <Package className="w-12 h-12 mx-auto mb-4" />
                                                <p className="text-xs font-black uppercase tracking-widest">No nodes allocated to this protocol.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Operational Intelligence Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 space-y-6">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-neutral-400" />
                                <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Institutional Narrative (Notes)</h4>
                            </div>
                            <textarea
                                value={header.notes || ''}
                                onChange={e => setHeader({ ...header, notes: e.target.value })}
                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-3xl p-6 text-xs font-bold h-40 focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                                placeholder="Internal protocol instructions, quality constraints, audit remarks..."
                            />
                        </div>
                        <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Governance Clauses (T&C)</h4>
                                </div>
                                <select
                                    onChange={e => setHeader({ ...header, terms_and_conditions: e.target.value })}
                                    className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full outline-none cursor-pointer"
                                >
                                    <option value="">Apply Clause...</option>
                                    {termsTemplates.map(t => <option key={t.name} value={t.content}>{t.name}</option>)}
                                </select>
                            </div>
                            <textarea
                                value={header.terms_and_conditions || ''}
                                onChange={e => setHeader({ ...header, terms_and_conditions: e.target.value })}
                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-3xl p-6 text-xs font-bold h-40 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all resize-none"
                                placeholder="Mandatory procurement clauses, liability limitations, payment constraints..."
                            />
                        </div>
                    </div>

                    {/* Evidence Attachment Row */}
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6 block flex items-center gap-3">
                            <Paperclip className="w-5 h-5" /> Audit Evidence (Quotations, Specs)
                        </label>
                        <div className="flex flex-wrap gap-4">
                            {attachments.map((file, i) => (
                                <div key={i} className="flex items-center gap-3 px-5 py-2.5 bg-neutral-50 dark:bg-neutral-900 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-neutral-100 dark:border-neutral-700 group transition-all hover:border-primary/20">
                                    <FileText className="w-4 h-4 text-neutral-400" />
                                    <span className="max-w-[150px] truncate">{file}</span>
                                    <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="text-neutral-300 hover:text-rose-500 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <label className="flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-neutral-800 border-2 border-dashed border-neutral-100 dark:border-neutral-700 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:border-primary/50 hover:text-primary cursor-pointer transition-all shadow-sm">
                                <Plus className="w-4 h-4" /> Upload Node Intel
                                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Fiscal Summary Sidebar */}
                <div className="w-full md:w-96 space-y-8">
                    <div className="bg-white dark:bg-neutral-800 p-10 rounded-[3.5rem] border border-neutral-200 dark:border-neutral-700 shadow-2xl space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        
                        <div>
                            <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] mb-10">Fiscal Aggregate</h4>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-xs font-black text-neutral-400 uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    <span className="text-neutral-900 dark:text-white tabular-nums">₹{totals.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-black text-neutral-400 uppercase tracking-widest">
                                    <span>Institutional Discount</span>
                                    <span className="text-emerald-500 tabular-nums">-₹{totals.discount.toLocaleString()}</span>
                                </div>
                                
                                <div className="pt-6 border-t border-neutral-100 dark:border-neutral-700 space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black text-neutral-400 uppercase tracking-widest italic opacity-60">
                                        <span>Tax Protocol</span>
                                        <span>{taxBreakdown.igst > 0 ? 'IGST (Inter-State)' : 'CGST+SGST (Intra)'}</span>
                                    </div>
                                    {taxBreakdown.cgst > 0 && (
                                        <>
                                            <div className="flex justify-between items-center text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                                <span>Central GST (50%)</span>
                                                <span className="tabular-nums">₹{taxBreakdown.cgst.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                                <span>State GST (50%)</span>
                                                <span className="tabular-nums">₹{taxBreakdown.sgst.toLocaleString()}</span>
                                            </div>
                                        </>
                                    )}
                                    {taxBreakdown.igst > 0 && (
                                        <div className="flex justify-between items-center text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                            <span>Integrated GST</span>
                                            <span className="tabular-nums">₹{taxBreakdown.igst.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-10 border-t border-neutral-100 dark:border-neutral-700">
                                    <div className="flex justify-between items-end mb-8">
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Total Quantum</p>
                                        <h3 className="text-4xl font-black text-primary tracking-tighter tabular-nums">₹{totals.total.toLocaleString()}</h3>
                                    </div>
                                    <div className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-[2rem] border border-neutral-100 dark:border-neutral-700">
                                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Lexical Amount</p>
                                        <p className="text-[11px] font-black text-neutral-600 dark:text-neutral-400 italic leading-relaxed tracking-tight">{amountInWords}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setHeader({ ...header, status: 'Draft' })}
                                    className="py-4 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <FileText className="w-4 h-4" /> Draft
                                </button>
                                <button
                                    className="py-4 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Truck className="w-4 h-4" /> Dispatch
                                </button>
                            </div>

                            <div className="p-6 bg-primary/5 rounded-[2.5rem] border border-primary/10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="billLater"
                                        checked={header.status === 'RECEIVED'}
                                        onChange={e => setHeader({ ...header, status: e.target.checked ? 'RECEIVED' : 'COMPLETED' })}
                                        className="w-5 h-5 rounded-lg border-primary/20 text-primary focus:ring-primary/20 cursor-pointer"
                                    />
                                    <label htmlFor="billLater" className="text-[10px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest cursor-pointer">
                                        Immediate Receipt Node
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                        <CreditCard className="w-3 h-3" /> Settlement Mode
                                    </label>
                                    <select
                                        value={(header as any).payment_method || 'Credit'}
                                        onChange={e => setHeader({ ...header, payment_method: e.target.value } as any)}
                                        className="w-full bg-white dark:bg-neutral-800 border border-primary/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none"
                                    >
                                        <option value="Credit">Institutional Credit</option>
                                        <option value="Cash">Cash Transaction</option>
                                        <option value="UPI">Digital (UPI/Bank)</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={isSaving}
                                className="w-full py-5 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />} 
                                {header.status === 'RECEIVED' ? 'Finalize Receipt' : 'Complete Protocol'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-8 rounded-[3rem] border border-amber-100 dark:border-amber-900/20">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
                            <h5 className="text-[10px] font-black text-amber-900/60 dark:text-amber-400 uppercase tracking-widest">Protocol Optimizer</h5>
                        </div>
                        <p className="text-[10px] text-amber-800 dark:text-amber-500 font-bold italic leading-relaxed pl-4 border-l-2 border-amber-500/30">
                            Ensure all SKU nodes are verified against supplier quotations to prevent institutional fiscal discrepancies.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseOrderForm;

function ShieldCheck({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
            <path d="m9 12 2 2 4-4"/>
        </svg>
    );
}
