import React, { useState, useEffect, useMemo } from 'react';
import { Save, Trash2, Plus, Search, FileText, Paperclip, X, History, AlertTriangle, Loader2, Info, CheckCircle2, Package, Truck, CreditCard, Zap } from 'lucide-react';
import { PurchaseOrder, PurchaseOrderItem } from "../../types/purchase";
import { usePurchaseItems } from "../../hooks/usePurchaseItems";
import { useBranchResolver } from "../../hooks/useBranchResolver";
import PageHeader from "../../components/shared/Layout/PageHeader";
import api from "../../services/api";
import { formatDate } from '../../utils/helpers';
import { Button, Checkbox, Input, Modal, Select, Textarea } from '../../components/shared';

interface Props {
    onBack?: () => void;
    onSave?: (order: Partial<PurchaseOrder>, items: PurchaseOrderItem[]) => Promise<void>;
    initialData?: PurchaseOrder | null;
}

const PurchaseOrderForm: React.FC<Props> = ({ onBack: __onBack = () => { }, onSave = async () => { }, initialData }) => {
    const { currentBranchId } = useBranchResolver();
    const [isSaving, setIsSaving] = useState(false);
    const [header, setHeader] = useState<Partial<PurchaseOrder>>({
        po_date: new Date().toISOString().split('T')[0],
        status: 'DRAFT',
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
    const [_vendorSearch] = useState('');

    // Items Hook
    const { items, setItems, addItem, updateItem, removeItem, totals } = usePurchaseItems([]);

    // Product Search
    const [products, setProducts] = useState<any[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    // Supplier Status
    const [supplierStatus, setSupplierStatus] = useState<any>(null);
    const [_loadingSupplier, setLoadingSupplier] = useState(false);

    // Rate History
    const [historyModal, setHistoryModal] = useState<{ show: boolean, item: string, data: any[], loading: boolean }>({ show: false, item: '', data: [], loading: false });

    // Load Vendors on Mount
    useEffect(() => {
        const loadVendors = async () => {
            try {
                const { data } = await api.get('/api/suppliers');
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
                const { data } = await api.get('/api/inventory', { params: { search: productSearch } });
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
                const { data } = await api.get(`/api/suppliers/analytics?supplierId=${header.vendor_id}`);
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
            const { data } = await api.get(`/api/purchases/history/item/${itemId}`);
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
    const [_lotModal, setLotModal] = useState<{ show: boolean, lotNumber: string, totalCost: number, totalQty: number, items: any[] }>({
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
            const { items: _items, ...sanitizedHeader } = header as any;
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
        const isIntraState = header.vendor_id?.toString().endsWith('1');
        const totalTax = totals.tax;
        if (isIntraState) {
            return { cgst: totalTax / 2, sgst: totalTax / 2, igst: 0, vat: 0 };
        }
        return { cgst: 0, sgst: 0, igst: totalTax, vat: 0 };
    }, [header.vendor_id, totals.tax]);

    const amountInWords = useMemo(() => numberToWords(Math.round(totals.total)), [totals.total]);

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
            {/* History Modal */}
            <Modal
                isOpen={historyModal.show}
                onClose={() => setHistoryModal(prev => ({ ...prev, show: false }))}
                title={`Price History: ${historyModal.item}`}
                size="sm"
            >
                {historyModal.loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : historyModal.data.length === 0 ? (
                    <div className="text-center py-12 opacity-40">
                        <Info className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No node history found.</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="pb-4">Fiscal Date</th>
                                <th className="pb-4">Vendor</th>
                                <th className="pb-4 text-right">Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {historyModal.data.map((h, i) => (
                                <tr key={i} className="group">
                                    <td className="py-4 text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter tabular-nums">{formatDate(h.date)}</td>
                                    <td className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{h.vendorName}</td>
                                    <td className="py-4 text-right text-xs font-black text-primary tabular-nums">₹{h.rate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Modal>

            <PageHeader
                title={initialData ? 'Refactor Order' : 'Institutional Order'}
                description="Initialize procurement nodes with verified supply-chain parameters."
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="primary"
                            size="md"
                            icon={<Save className="w-4 h-4" />}
                            onClick={handleSubmit}
                            disabled={isSaving}
                            loading={isSaving}
                        >
                            Save Node
                        </Button>
                    </div>
                }
                breadcrumbs={[
                    { label: 'Procurement', link: '/purchase' },
                    { label: 'Orders', link: '/purchase/orders' },
                    { label: initialData ? 'Refactor' : 'New' }
                ]}
            />

            {/* Supplier Warning Node */}
            {supplierStatus && (supplierStatus.overdueCount > 0 || supplierStatus.isCreditRisk) && (
                <div className="mx-8 mt-6 p-6 bg-danger-soft dark:bg-danger-soft border border-danger-line dark:border-danger/30 rounded-[2.5rem] flex items-center gap-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="p-4 bg-danger text-white rounded-sm shadow-lg shadow-rose-500/20">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-danger dark:text-danger uppercase tracking-widest">Supplier Risk Surveillance</h4>
                        <p className="text-xs font-bold text-danger dark:text-danger mt-1 italic leading-relaxed">
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
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">PO No.</label>
                            <div className="px-5 py-3 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-sm text-xs font-black text-slate-500 dark:text-slate-400 font-mono tracking-tighter ">
                                {header.po_number}
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Fiscal Date</label>
                            <Input
                                type="date"
                                value={header.po_date}
                                onChange={e => setHeader({ ...header, po_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">ETA Constraint</label>
                            <Input
                                type="date"
                                value={header.expected_delivery || ''}
                                onChange={e => setHeader({ ...header, expected_delivery: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Supplier</label>
                            <Select
                                options={[{ value: '', label: 'Select entity...' }, ...(Array.isArray(vendors) ? vendors.map(v => ({ value: v.id, label: v.name })) : [])]}
                                value={header.vendor_id || ''}
                                onChange={(value) => setHeader({ ...header, vendor_id: typeof value === 'string' ? value : value[0] })}
                            />
                        </div>
                    </div>

                    {/* Logistics Group */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Supply Hub</label>
                            <Select
                                options={[
                                    { value: 'Main Warehouse', label: 'Main Warehouse' },
                                    { value: 'Production Unit A', label: 'Production Unit A' },
                                    { value: 'Retail Outlet - Center', label: 'Retail Outlet - Center' },
                                    { value: 'Third-party Logistics (3PL)', label: 'Third-party Logistics (3PL)' },
                                ]}
                                value={header.delivery_location}
                                onChange={(value) => setHeader({ ...header, delivery_location: typeof value === 'string' ? value : value[0] })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Coordinate Precision (Address)</label>
                            <Input
                                type="text"
                                value={header.delivery_address || ''}
                                onChange={e => setHeader({ ...header, delivery_address: e.target.value })}
                                placeholder="Plot, Sector, Landmark..."
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Reference No.</label>
                            <Input
                                type="text"
                                value={header.reference_number || ''}
                                onChange={e => setHeader({ ...header, reference_number: e.target.value })}
                                placeholder="e.g. QUO-2024-X"
                            />
                        </div>
                    </div>

                    {/* Inventory Node Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-sm font-black uppercase tracking-widest">Inventory Nodes</h3>
                                <Button
                                    variant="tertiary"
                                    size="sm"
                                    icon={<Plus className="w-3.5 h-3.5" />}
                                    onClick={handleAddLot}
                                >
                                    Bulk Lot
                                </Button>
                            </div>
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Add SKU node..."
                                    value={productSearch}
                                    onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                                    className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-transparent rounded-sm text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                                {showProductDropdown && products.length > 0 && (
                                    <div className="absolute top-full mt-3 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-sm shadow-2xl z-[55] overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        {products.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleAddItem(p)}
                                                className="w-full text-left px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700 last:border-none transition-colors"
                                            >
                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{p.name}</p>
                                                <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">Vault Stock: {p.stock || 0} {p.unit || 'pcs'}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                                    <tr>
                                        <th className="px-8 py-5">Product SKU</th>
                                        <th className="px-8 py-5 w-24">Lot #</th>
                                        <th className="px-8 py-5 w-28 text-center">Quantity</th>
                                        <th className="px-8 py-5 w-24 text-center">Unit</th>
                                        <th className="px-8 py-5 w-32 text-right">Rate</th>
                                        <th className="px-8 py-5 w-20 text-center">Tax %</th>
                                        <th className="px-8 py-5 w-32 text-right">Total</th>
                                        <th className="px-8 py-5 w-16 text-center">Info</th>
                                        <th className="px-8 py-5 w-16 text-center">Del</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-all">
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{item.product_name}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <input
                                                    type="text"
                                                    value={item.lot_number || ''}
                                                    onChange={e => updateItem(idx, 'lot_number', e.target.value)}
                                                    className="w-20 bg-slate-50 dark:bg-slate-900 border border-transparent rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest focus:ring-1 focus:ring-primary/20 outline-none"
                                                    placeholder="LOT-X"
                                                />
                                            </td>
                                            <td className="px-8 py-5">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-lg px-3 py-1.5 text-xs font-black text-center tabular-nums focus:ring-1 focus:ring-primary/20 outline-none"
                                                />
                                            </td>
                                            <td className="px-8 py-5">
                                                <input
                                                    type="text"
                                                    value={item.unit || 'pcs'}
                                                    onChange={e => updateItem(idx, 'unit', e.target.value)}
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-center focus:ring-1 focus:ring-primary/20 outline-none"
                                                />
                                            </td>
                                            <td className="px-8 py-5">
                                                <input
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-lg px-3 py-1.5 text-xs font-black text-right tabular-nums focus:ring-1 focus:ring-primary/20 outline-none"
                                                />
                                            </td>
                                            <td className="px-8 py-5">
                                                <input
                                                    type="number"
                                                    value={item.tax_percent}
                                                    onChange={e => updateItem(idx, 'tax_percent', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-transparent rounded-lg px-2 py-1.5 text-[10px] font-black text-center tabular-nums focus:ring-1 focus:ring-primary/20 outline-none"
                                                />
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-xs text-slate-900 dark:text-white tabular-nums">
                                                ₹{item.line_total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <Button variant="tertiary" size="sm" icon={<History className="w-4 h-4" />} onClick={() => handleShowHistory(item.product_id || '', item.product_name)} />
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <Button variant="tertiary" size="sm" icon={<Trash2 className="w-4 h-4" />} className="text-danger" onClick={() => removeItem(idx)} />
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
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 space-y-6">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-slate-400" />
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</h4>
                            </div>
                            <Textarea
                                value={header.notes || ''}
                                onChange={e => setHeader({ ...header, notes: e.target.value })}
                                minRows={7}
                                placeholder="Internal protocol instructions, quality constraints, audit remarks..."
                            />
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-5 h-5 text-success" />
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Governance Clauses (T&C)</h4>
                                </div>
                                <Select
                                    options={[{ value: '', label: 'Apply Clause...' }, ...termsTemplates.map(t => ({ value: t.content, label: t.name }))]}
                                    value=""
                                    onChange={(value) => setHeader({ ...header, terms_and_conditions: typeof value === 'string' ? value : value[0] })}
                                    size="sm"
                                />
                            </div>
                            <Textarea
                                value={header.terms_and_conditions || ''}
                                onChange={e => setHeader({ ...header, terms_and_conditions: e.target.value })}
                                minRows={7}
                                placeholder="Mandatory procurement clauses, liability limitations, payment constraints..."
                            />
                        </div>
                    </div>

                    {/* Evidence Attachment Row */}
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 block flex items-center gap-3">
                            <Paperclip className="w-5 h-5" /> Audit Evidence (Quotations, Specs)
                        </label>
                        <div className="flex flex-wrap gap-4">
                            {attachments.map((file, i) => (
                                <div key={i} className="flex items-center gap-3 px-5 py-2.5 bg-slate-50 dark:bg-slate-900 rounded-sm text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 group transition-all hover:border-primary/20">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    <span className="max-w-[150px] truncate">{file}</span>
                                    <Button variant="tertiary" size="sm" icon={<X className="w-4 h-4" />} className="text-slate-300 hover:text-danger" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} />
                                </div>
                            ))}
                            <label className="flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-primary/50 hover:text-primary cursor-pointer transition-all shadow-sm">
                                <Plus className="w-4 h-4" /> Upload file
                                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Fiscal Summary Sidebar */}
                <div className="w-full md:w-96 space-y-8">
                    <div className="bg-white dark:bg-slate-800 p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-700 shadow-2xl space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">Fiscal Aggregate</h4>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    <span className="text-slate-900 dark:text-white tabular-nums">₹{totals.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                                    <span>Discount</span>
                                    <span className="text-success tabular-nums">-₹{totals.discount.toLocaleString()}</span>
                                </div>
                                
                                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic ">
                                        <span>Tax</span>
                                        <span>{taxBreakdown.igst > 0 ? 'IGST (Inter-State)' : 'CGST+SGST (Intra)'}</span>
                                    </div>
                                    {taxBreakdown.cgst > 0 && (
                                        <>
                                            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                <span>Central GST (50%)</span>
                                                <span className="tabular-nums">₹{taxBreakdown.cgst.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                <span>State GST (50%)</span>
                                                <span className="tabular-nums">₹{taxBreakdown.sgst.toLocaleString()}</span>
                                            </div>
                                        </>
                                    )}
                                    {taxBreakdown.igst > 0 && (
                                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <span>Integrated GST</span>
                                            <span className="tabular-nums">₹{taxBreakdown.igst.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-10 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-end mb-8">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total</p>
                                        <h3 className="text-4xl font-black text-primary tracking-tighter tabular-nums">₹{totals.total.toLocaleString()}</h3>
                                    </div>
                                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-700">
                                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Lexical Amount</p>
                                        <p className="text-[11px] font-black text-slate-600 dark:text-slate-400 italic leading-relaxed tracking-tight">{amountInWords}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="secondary"
                                    size="md"
                                    icon={<FileText className="w-4 h-4" />}
                                    onClick={() => setHeader({ ...header, status: 'DRAFT' })}
                                >
                                    Draft
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="md"
                                    icon={<Truck className="w-4 h-4" />}
                                >
                                    Dispatch
                                </Button>
                            </div>

                            <div className="p-6 bg-primary/5 rounded-[2.5rem] border border-primary/10 space-y-4">
                                <Checkbox
                                    id="billLater"
                                    label="Receive now"
                                    checked={header.status === 'RECEIVED'}
                                    onChange={e => setHeader({ ...header, status: e.target.checked ? 'RECEIVED' : 'COMPLETED' })}
                                />

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                        <CreditCard className="w-3 h-3" /> Settlement Mode
                                    </label>
                                    <Select
                                        options={[
                                            { value: 'Credit', label: 'Credit' },
                                            { value: 'Cash', label: 'Cash Transaction' },
                                            { value: 'UPI', label: 'Digital (UPI/Bank)' },
                                        ]}
                                        value={(header as any).payment_method || 'Credit'}
                                        onChange={(value) => setHeader({ ...header, payment_method: (typeof value === 'string' ? value : value[0]) } as any)}
                                        size="sm"
                                    />
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                size="lg"
                                icon={<CheckCircle2 className="w-5 h-5" />}
                                onClick={handleSubmit}
                                disabled={isSaving}
                                loading={isSaving}
                                fullWidth
                            >
                                {header.status === 'RECEIVED' ? 'Finalize Receipt' : 'Complete Protocol'}
                            </Button>
                        </div>
                    </div>
                    
                    <div className="bg-warning-soft dark:bg-warning-soft p-8 rounded-xl border border-warning-line dark:border-warning/20">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="w-5 h-5 text-warning animate-pulse" />
                            <h5 className="text-[10px] font-black text-warning/60 dark:text-warning uppercase tracking-widest">Suggestions</h5>
                        </div>
                        <p className="text-[10px] text-warning dark:text-warning font-bold italic leading-relaxed pl-4 border-l-2 border-warning/30">
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
