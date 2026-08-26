import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus, Search, FileText, Paperclip, X, AlertCircle, CheckCircle, Clock, RotateCcw, Truck, Ban, ShieldCheck, Zap, Info, Activity, ChevronDown } from 'lucide-react';
import { PurchaseReturn, PurchaseReturnItem, ReturnReason, PurchaseReturnStatus, GRN, PurchaseOrder } from "../../types/purchase";
import api from "../../services/api";
import { toast } from 'react-toastify';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";

interface Props {
    onBack?: () => void;
    onSave?: (returns: Partial<PurchaseReturn>) => Promise<void>;
    initialData?: PurchaseReturn | null;
}

const PurchaseReturnForm: React.FC<Props> = ({ onBack, onSave = async () => { }, initialData }) => {
    const { id, grnId } = useParams<{ id?: string, grnId?: string }>();
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) onBack();
        else navigate('/purchase/returns');
    };

    const [returnData, setReturnData] = useState<Partial<PurchaseReturn>>({
        return_date: new Date().toISOString().split('T')[0],
        status: 'Initiated',
        reason: 'Quality Issues',
        total_amount: 0,
        tax_amount: 0,
        attachments: [],
        items: [] as any
    });

    const [vendors, setVendors] = useState<any[]>([]);
    const [grns, setGrns] = useState<GRN[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch Return if ID exists
    useEffect(() => {
        if (id) {
            const fetchReturn = async () => {
                try {
                    const { data } = await api.get(`/api/purchase-returns/${id}`);
                    setReturnData(data);
                } catch (err) {
                    console.error("Failed to fetch return", err);
                }
            };
            fetchReturn();
        }
    }, [id]);

    // Fetch Vendors
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const { data } = await api.get('/suppliers');
                setVendors(data || []);
            } catch (err) {
                console.error("Failed to fetch suppliers", err);
            }
        };
        fetchVendors();
    }, []);

    // Fetch GRNs when vendor is selected
    useEffect(() => {
        if (!returnData.vendor_id) return;
        const fetchGRNs = async () => {
            try {
                const { data } = await api.get(`/api/grns?vendorId=${returnData.vendor_id}`);
                setGrns(data || []);

                if (grnId && !returnData.grn_id) {
                    const targetGrn = (data || []).find((g: any) => g.id === grnId || g._id === grnId);
                    if (targetGrn) {
                        handleGRNChange(grnId, data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch GRNs", err);
            }
        };
        fetchGRNs();
    }, [returnData.vendor_id, grnId]);

    const handleVendorChange = (vendorId: string) => {
        const vendor = vendors.find(v => v.id === vendorId || v._id === vendorId);
        setReturnData(prev => ({
            ...prev,
            vendor_id: vendorId,
            vendor_name: vendor?.businessName || vendor?.name || '',
            grn_id: undefined,
            grn_number: undefined,
            items: []
        }));
    };

    const handleGRNChange = (selectedGrnId: string, availableGrns = grns) => {
        const grn = availableGrns.find(g => g.id === selectedGrnId || (g as any)._id === selectedGrnId);
        if (grn) {
            const returnItems: PurchaseReturnItem[] = grn.items.map(item => ({
                id: Math.random().toString(36).substr(2, 9),
                itemId: item.productId,
                product_id: item.productId,
                product_name: item.productName,
                sku: item.sku,
                grn_quantity: item.acceptedQty,
                return_quantity: 0,
                rate: 0,
                tax_percent: 18,
                line_total: 0
            }));

            setReturnData(prev => ({
                ...prev,
                grn_id: selectedGrnId,
                grn_number: grn.grnNumber,
                po_id: grn.poId,
                po_number: grn.poNumber,
                items: returnItems as any
            }));
        }
    };

    const updateItem = (index: number, field: keyof PurchaseReturnItem, value: any) => {
        const newItems = [...(returnData.items || [])] as PurchaseReturnItem[];
        const item = { ...newItems[index], [field]: value };

        if (field === 'return_quantity') {
            if (value > item.grn_quantity) {
                toast.warning(`Cannot return more than received (${item.grn_quantity})`);
                item.return_quantity = item.grn_quantity;
            }
        }

        item.line_total = (item.return_quantity || 0) * (item.rate || 0);
        newItems[index] = item;
        setReturnData(prev => ({ ...prev, items: newItems as any }));
    };

    const totals = useMemo(() => {
        const subtotal = (returnData.items || []).reduce((sum, item) => sum + (item.line_total || 0), 0);
        const tax = (subtotal * 18) / 100;
        return { subtotal, tax, total: subtotal + tax };
    }, [returnData.items]);

    const handleSave = async () => {
        if (!returnData.vendor_id || !returnData.grn_id) {
            toast.warning("Vendor and GRN are required");
            return;
        }
        if ((returnData.items || []).every(i => i.return_quantity === 0)) {
            toast.warning("Please specify items to return");
            return;
        }

        setIsLoading(true);
        try {
            await onSave({
                ...returnData,
                total_amount: totals.total,
                tax_amount: totals.tax
            });
            toast.success("Purchase Return initiated successfully");
            navigate('/purchase/returns');
        } catch (err) {
            toast.error("Failed to save return");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = (newStatus: PurchaseReturnStatus) => {
        setReturnData(prev => ({ ...prev, status: newStatus }));
    };

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title={id ? "Refactor Reversal Node" : "Reversal Node Initialization"}
                    description="Record institutional reversal protocols (Debit Notes) against verified GRNs."
                    breadcrumbs={[
                        { label: 'Procurement', link: '/purchase' },
                        { label: 'Returns Archive', link: '/purchase/returns' },
                        { label: id ? 'Refactor' : 'New Reversal' }
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBack}
                                className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95"
                            >
                                <ArrowLeft className="w-4 h-4" /> Abort
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95"
                            >
                                <Save className="w-4 h-4" /> {id ? 'Update Node' : 'Initialize Reversal'}
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Workspace */}
                    <div className="lg:col-span-8 space-y-10">
                        <div className="bg-white dark:bg-neutral-800 p-10 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-3 mb-10">
                                <Activity className="w-5 h-5 text-primary" /> Institutional Parameters
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Institutional Vendor</label>
                                    <select
                                        value={returnData.vendor_id || ''}
                                        onChange={(e) => handleVendorChange(e.target.value)}
                                        className="w-full px-6 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black uppercase tracking-tighter shadow-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="">Select entity...</option>
                                        {vendors.map(v => <option key={v._id || v.id} value={v._id || v.id}>{v.businessName || v.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Linked GRN Node</label>
                                    <select
                                        value={returnData.grn_id || ''}
                                        onChange={(e) => handleGRNChange(e.target.value)}
                                        disabled={!returnData.vendor_id}
                                        className="w-full px-6 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black uppercase tracking-tighter shadow-sm focus:ring-4 focus:ring-primary/10 outline-none disabled:opacity-30 cursor-pointer"
                                    >
                                        <option value="">Select node...</option>
                                        {grns.map(g => <option key={g.id} value={g.id}>{g.grnNumber} ({new Date(g.receivedDate).toLocaleDateString()})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Incident Vector (Reason)</label>
                                    <div className="relative">
                                        <select
                                            value={returnData.reason}
                                            onChange={(e) => setReturnData({ ...returnData, reason: e.target.value as ReturnReason })}
                                            className="w-full pl-6 pr-12 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black uppercase tracking-tighter shadow-sm focus:ring-4 focus:ring-rose-500/10 outline-none appearance-none cursor-pointer"
                                        >
                                            <option value="Defective">Defective / Damaged</option>
                                            <option value="Wrong Item">Wrong Item Received</option>
                                            <option value="Excess Quantity">Excess Quantity</option>
                                            <option value="Quality Issues">Quality Issues</option>
                                            <option value="Others">Others</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Fiscal Date</label>
                                    <input
                                        type="date"
                                        value={returnData.return_date}
                                        onChange={(e) => setReturnData({ ...returnData, return_date: e.target.value })}
                                        className="w-full px-6 py-3.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black focus:ring-4 focus:ring-primary/10 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Reversal Ledger Workspace */}
                        <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-700">
                            <div className="p-10 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase tracking-widest">Reversal Node Allocation</h3>
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60">Source: {returnData.grn_number || 'No Node Linked'}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-neutral-50/50 dark:bg-neutral-900/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800">
                                        <tr>
                                            <th className="px-8 py-5">Product SKU</th>
                                            <th className="px-8 py-5 text-center">GRN Intake</th>
                                            <th className="px-8 py-5 text-center w-40">Reversal Qty</th>
                                            <th className="px-8 py-5 text-right">Unit Rate</th>
                                            <th className="px-8 py-5 text-right">Node Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {(returnData.items || []).map((item, idx) => (
                                            <tr key={idx} className={`group hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 transition-all ${item.return_quantity > 0 ? 'bg-rose-50/20 dark:bg-rose-900/5' : ''}`}>
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-black text-neutral-900 dark:text-white uppercase tracking-tighter leading-none mb-1">{item.product_name}</p>
                                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest opacity-60">{item.sku || 'NO-SKU'}</p>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="text-[10px] font-black text-neutral-400 tabular-nums">{item.grn_quantity}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <input
                                                        type="number"
                                                        value={item.return_quantity}
                                                        onChange={(e) => updateItem(idx, 'return_quantity', parseFloat(e.target.value) || 0)}
                                                        className={`w-full text-center py-2.5 bg-neutral-100 dark:bg-neutral-900 border border-transparent rounded-xl text-xs font-black tabular-nums focus:ring-2 focus:ring-primary/20 outline-none transition-all ${item.return_quantity > 0 ? 'text-primary' : 'text-neutral-400'}`}
                                                    />
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-[10px] font-black text-neutral-400">₹</span>
                                                        <input
                                                            type="number"
                                                            value={item.rate}
                                                            onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                                                            className="w-24 text-right bg-transparent border-b border-dashed border-neutral-300 dark:border-neutral-700 py-1 text-xs font-black tabular-nums focus:border-primary outline-none"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="text-sm font-black text-neutral-900 dark:text-white tabular-nums tracking-tight">₹{item.line_total.toFixed(2)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {(!returnData.items || returnData.items.length === 0) && (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-32 text-center">
                                                    <div className="flex flex-col items-center gap-6 opacity-30 grayscale max-w-sm mx-auto">
                                                        <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-sm flex items-center justify-center">
                                                            <Info className="w-10 h-10" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-sm uppercase tracking-widest text-center">No Nodes Allocated</p>
                                                            <p className="text-xs font-bold mt-2 italic leading-relaxed text-center">Select an institutional vendor and linked GRN to initialize reversal nodes.</p>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Operational Intel Sidebar */}
                    <div className="lg:col-span-4 space-y-10">
                        {/* Financial Aggregate */}
                        <div className="bg-neutral-900 dark:bg-neutral-900 p-10 rounded-[3.5rem] text-white shadow-2xl space-y-10 relative overflow-hidden group">
                            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                                <Zap className="w-48 h-48" />
                            </div>
                            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] relative z-10">Refund Protocol</h3>
                            
                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    <span className="tabular-nums">₹{totals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                    <span>Tax Reversal (18%)</span>
                                    <span className="tabular-nums">₹{totals.tax.toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-white/5 w-full my-6"></div>
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Total Debit Quantum</p>
                                    <p className="text-5xl font-black tracking-tighter text-white tabular-nums">₹{totals.total.toFixed(2)}</p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Awaiting Institutional Credit</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5 flex items-start gap-4 relative z-10 opacity-60 italic">
                                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                                <p className="text-[10px] font-black leading-relaxed text-neutral-400">
                                    Generating this reversal node will initialize a <span className="text-white underline">Debit Note</span> and decrement institutional vault counts upon authorization.
                                </p>
                            </div>
                        </div>

                        {/* Lifecycle Control */}
                        <div className="bg-white dark:bg-neutral-800 p-8 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-6">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-3">
                                <Truck className="w-5 h-5" /> Logistics Protocol
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Protocol State</label>
                                    <div className="px-5 py-2.5 bg-primary/5 text-primary border border-primary/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-center">
                                        {returnData.status}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Transit Node ID (Tracking)</label>
                                    <input
                                        type="text"
                                        value={returnData.tracking_number || ''}
                                        onChange={(e) => setReturnData({ ...returnData, tracking_number: e.target.value })}
                                        placeholder="Carrier code..."
                                        className="w-full px-5 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Narrative Node */}
                        <div className="bg-white dark:bg-neutral-800 p-8 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-6">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-3">
                                <FileText className="w-5 h-5" /> Institutional Narrative
                            </h3>
                            <textarea
                                className="w-full px-6 py-5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none h-40"
                                placeholder="Audit trail remarks, incident details..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PurchaseReturnForm;
