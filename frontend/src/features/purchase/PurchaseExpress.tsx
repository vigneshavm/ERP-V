import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    Zap, Search, Plus, Trash2, User, Calendar, FileText, ShoppingBag,
    CheckCircle2, Loader2, ArrowRight,
    Upload, Activity, BarChart3, ShieldCheck
} from 'lucide-react';
import { RootState } from "../../redux/store";
import { getAllSuppliers } from "../../redux/slices/supplierSlice";
import { getAllItems } from "../../redux/slices/inventorySlice";
import { usePurchaseItems } from "../../hooks/usePurchaseItems";
import api from "../../services/api";
import Layout from "../../components/shared/Layout/index";
import PageHeader from "../../components/shared/Layout/PageHeader";
import { toast } from 'react-toastify';

const PurchaseExpress: React.FC = () => {
    const dispatch = useDispatch<any>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { suppliers: reduxSuppliers } = useSelector((state: RootState) => state.suppliers);
    const { items: products } = useSelector((state: RootState) => state.inventory);

    // Form State
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNo, setInvoiceNo] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [paymentMode, setPaymentMode] = useState<'CASH' | 'CREDIT'>('CREDIT');
    const [isProcessing, setIsProcessing] = useState(false);
    const [referenceDoc, setReferenceDoc] = useState('');
    const [notes, setNotes] = useState('');
    const [autoPrint, setAutoPrint] = useState(false);

    // Items Hook
    const { items, setItems, removeItem, totals, updateItem } = usePurchaseItems([{
        id: Math.random().toString(36).substr(2, 9),
        product_id: '',
        product_name: '',
        sku: '',
        quantity: 1,
        rate: 0,
        tax_percent: 0,
        discount_amount: 0,
        line_total: 0,
        unit: 'Pcs'
    }]);

    const [activeSearchRow, setActiveSearchRow] = useState<number | null>(null);

    useEffect(() => {
        if (!reduxSuppliers?.length) dispatch(getAllSuppliers());
        if (!products?.length) dispatch(getAllItems());
    }, [dispatch]);

    // Calculate Tax Split
    const currentSupplier = reduxSuppliers?.find(s => s._id === supplierId);
    // Note: user.tenantState might be missing in redux, fallback to general check
    const isInterState = currentSupplier?.state && user?.tenantState && currentSupplier.state.toLowerCase() !== user.tenantState.toLowerCase();
    
    const cgst = !isInterState ? totals.tax / 2 : 0;
    const sgst = !isInterState ? totals.tax / 2 : 0;
    const igst = isInterState ? totals.tax : 0;

    const handleSave = async () => {
        if (!supplierId) return toast.error('Please select a supplier');
        const validItems = items.filter(i => i.product_name.trim());
        if (validItems.length === 0) return toast.error('Add at least one item');

        setIsProcessing(true);
        try {
            const payload = {
                p_vendor_id: supplierId,
                details: {
                    invoice_no: invoiceNo || `EXP-${Date.now()}`,
                    date: purchaseDate,
                    total_amount: totals.total,
                    payment_mode: paymentMode,
                    reference_doc: referenceDoc,
                    notes: notes
                },
                items: validItems,
                status: 'COMPLETED',
                auto_inventory: true,
                payment_status: paymentMode === 'CREDIT' ? 'UNPAID' : 'PAID'
            };

            const { data } = await api.post('/api/purchases', payload);
            toast.success(`Protocol Finalized! #${data.purchase_number || ''}`);
            
            resetForm();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save purchase');
        } finally {
            setIsProcessing(false);
        }
    };

    const resetForm = () => {
        setInvoiceNo('');
        setSupplierId('');
        setSupplierName('');
        setSupplierSearch('');
        setPaymentMode('CREDIT');
        setReferenceDoc('');
        setNotes('');
        setItems([{
            id: Math.random().toString(36).substr(2, 9),
            product_id: '',
            product_name: '',
            sku: '',
            quantity: 1,
            rate: 0,
            tax_percent: 0,
            discount_amount: 0,
            line_total: 0,
            unit: 'Pcs'
        }]);
    };

    return (
        <Layout>
            <div className="max-w-[1400px] mx-auto pt-8 space-y-10 pb-32 animate-in fade-in duration-700">
                <PageHeader 
                    title="Express Purchase Intelligence" 
                    description="Institutionalized single-node inwarding for high-velocity environments."
                    breadcrumbs={[
                        { label: 'Procurement', link: '/purchase' },
                        { label: 'Express Node' }
                    ]}
                    actions={
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-900 rounded-sm border border-neutral-200 dark:border-neutral-800">
                                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Auto-Print Labels</span>
                                <button 
                                    onClick={() => setAutoPrint(!autoPrint)}
                                    className={`w-10 h-5 rounded-full transition-all relative ${autoPrint ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoPrint ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                            <button 
                                onClick={handleSave}
                                disabled={isProcessing}
                                className="px-8 py-3 bg-primary text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                                Commit Node
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                    {/* LEFT: FORM SYSTEM */}
                    <div className="xl:col-span-8 space-y-10">
                        {/* Section 1: Entity & Fiscal Context */}
                        <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm">
                            <div className="p-10 space-y-10">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-primary/10 text-primary rounded-[1.5rem]">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Step 01 / Entity Context</h3>
                                        <p className="text-xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase">Supplier Identification</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-1 relative group">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Institutional Vendor</label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary transition-colors" />
                                            <input 
                                                type="text"
                                                placeholder={supplierName ? supplierName : "Search entity..."}
                                                value={supplierSearch}
                                                onChange={e => {
                                                    setSupplierSearch(e.target.value);
                                                    setShowSupplierDropdown(true);
                                                    if (supplierId) {
                                                        setSupplierId('');
                                                        setSupplierName('');
                                                    }
                                                }}
                                                onFocus={() => {
                                                    setShowSupplierDropdown(true);
                                                    dispatch(getAllSuppliers()); // Refresh list on focus
                                                }}
                                                className={`w-full pl-12 pr-4 py-3.5 bg-neutral-50 dark:bg-neutral-900 border ${supplierId ? 'border-primary/50' : 'border-transparent'} rounded-[1.5rem] text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none uppercase tracking-tighter`}
                                            />
                                            {supplierId && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                                </div>
                                            )}
                                        </div>
                                        {showSupplierDropdown && (
                                            <div 
                                                className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-100 dark:border-neutral-700 z-50 overflow-hidden animate-in slide-in-from-top-4 duration-300"
                                                onMouseLeave={() => setShowSupplierDropdown(false)}
                                            >
                                                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                                    {reduxSuppliers?.filter(s => s.businessName.toLowerCase().includes(supplierSearch.toLowerCase())).length > 0 ? (
                                                        reduxSuppliers?.filter(s => s.businessName.toLowerCase().includes(supplierSearch.toLowerCase())).map(s => (
                                                            <div 
                                                                key={s._id}
                                                                onClick={() => {
                                                                    setSupplierId(s._id);
                                                                    setSupplierName(s.businessName);
                                                                    setSupplierSearch('');
                                                                    setShowSupplierDropdown(false);
                                                                }}
                                                                className="px-8 py-5 hover:bg-primary/5 cursor-pointer flex items-center justify-between group/item border-b border-neutral-50 dark:border-neutral-800 last:border-0"
                                                            >
                                                                <div>
                                                                    <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter">{s.businessName}</p>
                                                                    <p className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-widest">{s.state || s.city || 'General Node'}</p>
                                                                </div>
                                                                <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover/item:opacity-100 transition-all -translate-x-2 group-hover/item:translate-x-0" />
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-8 py-10 text-center space-y-3">
                                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-relaxed">No Institutional Entity Found</p>
                                                            <button 
                                                                onClick={() => window.open('/suppliers', '_blank')}
                                                                className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
                                                            >
                                                                Initialize New Vendor
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Invoice Ref #</label>
                                        <div className="relative">
                                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                            <input 
                                                type="text"
                                                placeholder="e.g. INV/2024/001"
                                                value={invoiceNo}
                                                onChange={e => setInvoiceNo(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-[1.5rem] text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none uppercase tracking-tighter"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Fiscal Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                            <input 
                                                type="date"
                                                value={purchaseDate}
                                                onChange={e => setPurchaseDate(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-[1.5rem] text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Product Mutation Vector */}
                        <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm">
                            <div className="p-10 space-y-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-emerald-50 text-success dark:bg-emerald-900/20 rounded-[1.5rem]">
                                            <ShoppingBag className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Step 02 / Node Mutation</h3>
                                            <p className="text-xl font-black text-neutral-900 dark:text-white tracking-tighter uppercase">Payload Definition</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setItems([...items, { id: Math.random().toString(36).substr(2, 9), product_name: '', quantity: 1, rate: 0, tax_percent: 0, discount_amount: 0, line_total: 0, unit: 'Pcs' }])}
                                        className="px-6 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary/5 hover:text-primary transition-all shadow-sm active:scale-95"
                                    >
                                        <Plus className="w-4 h-4" /> Add Item Node
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Table Header */}
                                    <div className="px-6 grid grid-cols-12 gap-6 text-[10px] font-black text-neutral-300 uppercase tracking-widest">
                                        <div className="col-span-4">Product Intelligence / Description</div>
                                        <div className="col-span-2">Category</div>
                                        <div className="col-span-2 text-center">Quantum (Qty)</div>
                                        <div className="col-span-2 text-right">Unit Rate (₹)</div>
                                        <div className="col-span-1 text-right">Total Vector</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    {items.map((item, idx) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-6 items-center p-6 bg-neutral-50 dark:bg-neutral-900/40 rounded-[2rem] border border-transparent hover:border-primary/20 transition-all group/row animate-in slide-in-from-bottom-2 duration-300">
                                            <div className="col-span-4 relative">
                                                <input 
                                                    type="text"
                                                    placeholder="Search item node..."
                                                    value={item.product_name}
                                                    onChange={e => updateItem(idx, 'product_name', e.target.value)}
                                                    onFocus={() => setActiveSearchRow(idx)}
                                                    className="w-full bg-transparent border-none text-xs font-black uppercase tracking-tighter placeholder:text-neutral-300 focus:ring-0 text-neutral-900 dark:text-white"
                                                />
                                                {item.sku && <p className="text-[9px] font-bold text-neutral-400 mt-1 uppercase tracking-widest font-mono">SKU: {item.sku}</p>}
                                                
                                                {activeSearchRow === idx && item.product_name && (
                                                    <div className="absolute top-full left-0 right-0 mt-6 bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl border border-neutral-100 dark:border-neutral-700 z-50 max-h-60 overflow-hidden overflow-y-auto custom-scrollbar animate-in zoom-in-95">
                                                        {products.filter(p => p.name.toLowerCase().includes(item.product_name.toLowerCase())).map(p => (
                                                            <div 
                                                                key={p.id}
                                                                onClick={() => {
                                                                    updateItem(idx, 'product_name', p.name);
                                                                    updateItem(idx, 'product_id', p.id);
                                                                    updateItem(idx, 'sku', p.sku);
                                                                    updateItem(idx, 'category', p.category);
                                                                    updateItem(idx, 'rate', (p as any).costPrice || (p as any).cost_price || 0);
                                                                    updateItem(idx, 'tax_percent', (p as any).taxRate || (p as any).tax_percent || 0);
                                                                    updateItem(idx, 'unit', p.unit || 'Pcs');
                                                                    setActiveSearchRow(null);
                                                                }}
                                                                className="px-8 py-4 hover:bg-primary/5 cursor-pointer flex items-center justify-between border-b border-neutral-50 dark:border-neutral-800 last:border-0"
                                                            >
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-[10px] font-black uppercase tracking-tighter text-neutral-900 dark:text-white">{p.name}</p>
                                                                        <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-[8px] font-black uppercase text-neutral-400 tracking-widest">{p.category}</span>
                                                                    </div>
                                                                    <p className="text-[9px] font-bold text-neutral-400 mt-1 font-mono">{p.sku}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] font-black text-primary">₹{(p as any).costPrice || (p as any).cost_price || 0}</p>
                                                                    <p className="text-[9px] font-bold text-neutral-400 mt-1 uppercase">Stock: {p.stockQty} {p.unit}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-span-2">
                                                <div className="px-3 py-1 bg-white/50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-700 text-center">
                                                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest truncate block">
                                                        {item.category || 'Unset'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col-span-2 flex items-center gap-2">
                                                <input 
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent border-none text-xs font-black text-center focus:ring-0 text-neutral-900 dark:text-white"
                                                />
                                                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">{item.unit}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <input 
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={e => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent border-none text-xs font-black text-right focus:ring-0 text-neutral-900 dark:text-white tabular-nums"
                                                />
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <span className="text-sm font-black text-primary tracking-tighter tabular-nums">₹{item.line_total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <button onClick={() => removeItem(idx)} className="p-3 text-neutral-300 hover:text-danger hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Additional Intelligence: Notes & Attachments */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="bg-white dark:bg-neutral-800 rounded-[3rem] p-10 border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-6">
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] block">Institutional Remarks</label>
                                <textarea 
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Enter additional transaction context..."
                                    className="w-full h-24 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-[2rem] p-6 text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="bg-white dark:bg-neutral-800 rounded-[3rem] p-10 border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-6 flex flex-col justify-center items-center group cursor-pointer hover:border-primary/20 transition-all">
                                <div className="p-5 bg-neutral-50 dark:bg-neutral-900 rounded-[2rem] text-neutral-400 group-hover:text-primary transition-all">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-white">Reference Payload</p>
                                    <p className="text-[10px] font-bold text-neutral-400 mt-1 uppercase tracking-widest">Upload Invoice Image/PDF</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: FISCAL SUMMARY CORE */}
                    <div className="xl:col-span-4 space-y-10">
                        <div className="bg-neutral-900 dark:bg-neutral-950 p-12 rounded-[4rem] text-white shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] space-y-12 relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-1000">
                                <Activity className="w-64 h-64" />
                            </div>

                            <div className="relative z-10 space-y-12">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/5 rounded-sm border border-white/5">
                                        <BarChart3 className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">Fiscal Summary</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Base Quantum</span>
                                        <span className="text-sm font-black tabular-nums tracking-tighter">₹{totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Tax (CGST @{(!isInterState && totals.tax > 0) ? '9%' : '0%'})</span>
                                        <span className="text-sm font-black tabular-nums tracking-tighter">₹{cgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Tax (SGST @{(!isInterState && totals.tax > 0) ? '9%' : '0%'})</span>
                                        <span className="text-sm font-black tabular-nums tracking-tighter">₹{sgst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    {isInterState && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Tax (IGST @18%)</span>
                                            <span className="text-sm font-black tabular-nums tracking-tighter text-warning">₹{igst.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    <div className="h-px bg-white/5 my-8" />
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Total Node Liability</span>
                                        <span className="text-6xl font-black tabular-nums tracking-tighter drop-shadow-2xl">₹{totals.total.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-2">{items.filter(i => i.product_name).length} Active Item Nodes</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Settlement Strategy</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {(['CASH', 'CREDIT'] as const).map(mode => (
                                            <button 
                                                key={mode}
                                                onClick={() => setPaymentMode(mode)}
                                                className={`py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
                                                    paymentMode === mode 
                                                    ? 'bg-primary border-primary text-white shadow-2xl shadow-primary/40 scale-105' 
                                                    : 'bg-white/5 border-white/10 text-neutral-500 hover:bg-white/10'
                                                }`}
                                            >
                                                {mode === 'CASH' ? 'Liquid Paid' : 'Deferred'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSave}
                                    disabled={isProcessing}
                                    className="w-full py-6 bg-white text-black rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-primary hover:text-white transition-all transform active:scale-95 flex items-center justify-center gap-4 group"
                                >
                                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                                    Commit Protocol
                                </button>
                            </div>
                        </div>

                        {/* Audit Log / Pulse Node */}
                        <div className="p-10 bg-emerald-500/5 dark:bg-success/10 border border-emerald-500/10 rounded-[3.5rem] space-y-6 animate-pulse hover:animate-none transition-all">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-neutral-900 rounded-sm text-success shadow-sm border border-success/20">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <h4 className="text-[10px] font-black text-emerald-600 dark:text-success uppercase tracking-widest leading-none">System Intelligence</h4>
                            </div>
                            <p className="text-[11px] text-emerald-800 dark:text-success font-bold leading-relaxed italic border-l-2 border-success/30 pl-4">
                                {supplierId ? `Inwarding stock from ${supplierName}. Financial ledger and inventory buckets will be mutated on commit.` : "Standing by for entity selection and payload definition. High-velocity mode active."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PurchaseExpress;
