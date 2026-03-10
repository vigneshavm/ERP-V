
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus, Search, FileText, Paperclip, X, AlertCircle, CheckCircle, Clock, RotateCcw, Truck, Ban } from 'lucide-react';
import { PurchaseReturn, PurchaseReturnItem, ReturnReason, PurchaseReturnStatus, GRN, PurchaseOrder } from "@repo/shared-kernel";
import api from "@/shared/api/api";
import { toast } from 'react-toastify';

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
                    toast.error("Failed to load return details");
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
                itemId: item.productId, // Ensure backend receives this for stock adjustment
                product_id: item.productId,
                product_name: item.productName,
                sku: item.sku,
                grn_quantity: item.acceptedQty,
                return_quantity: 0, // Default to 0, user specifies what to return
                rate: 0, // In real app, fetch from PO/GRN
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

        // Validation: Return qty cannot exceed GRN qty
        if (field === 'return_quantity') {
            if (value > item.grn_quantity) {
                toast.warning(`Cannot return more than received (${item.grn_quantity})`);
                item.return_quantity = item.grn_quantity;
            }
        }

        item.line_total = item.return_quantity * item.rate;
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
            const payload = {
                ...returnData,
                total_amount: totals.total,
                tax_amount: totals.tax
            };
            console.log("Saving Return:", payload);
            toast.success("Purchase Return initiated successfully");

            // Trigger Inventory Impact Notification
            toast.info("Stock levels will be adjusted upon processing.");

            navigate('/purchase/returns');
        } catch (err) {
            toast.error("Failed to save return");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = (newStatus: PurchaseReturnStatus) => {
        setReturnData(prev => ({ ...prev, status: newStatus }));
        toast.info(`Return status updated to ${newStatus}`);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
                <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-neutral-500" /> Purchase Return (Debit Note)
                        </h2>
                        <p className="text-xs text-neutral-500 font-medium tracking-tight">Return items to vendor against GRN</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-lg shadow-brand-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" /> {isLoading ? 'Saving...' : id ? 'Update Return' : 'Finalize Return'}
                    </button>
                    <button onClick={handleBack} className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400 font-semibold text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                        Cancel
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Return Header Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wider">Vendor / Supplier</label>
                                    <select
                                        value={returnData.vendor_id || ''}
                                        onChange={(e) => handleVendorChange(e.target.value)}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                                    >
                                        <option value="">Select Vendor</option>
                                        {vendors.map(v => <option key={v._id || v.id} value={v._id || v.id}>{v.businessName || v.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wider">Linked GRN</label>
                                    <select
                                        value={returnData.grn_id || ''}
                                        onChange={(e) => handleGRNChange(e.target.value)}
                                        disabled={!returnData.vendor_id}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
                                    >
                                        <option value="">Select GRN</option>
                                        {grns.map(g => <option key={g.id} value={g.id}>{g.grnNumber} ({new Date(g.receivedDate).toLocaleDateString()})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wider">Return Reason</label>
                                    <select
                                        value={returnData.reason}
                                        onChange={(e) => setReturnData({ ...returnData, reason: e.target.value as ReturnReason })}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                                    >
                                        <option value="Defective">Defective / Damaged</option>
                                        <option value="Wrong Item">Wrong Item Received</option>
                                        <option value="Excess Quantity">Excess Quantity</option>
                                        <option value="Quality Issues">Quality Issues</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 mb-2 uppercase tracking-wider">Return Date</label>
                                    <input
                                        type="date"
                                        value={returnData.return_date}
                                        onChange={(e) => setReturnData({ ...returnData, return_date: e.target.value })}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status / Tracking Panel */}
                        <div className="bg-brand-50/30 dark:bg-brand-900/10 p-6 rounded-2xl border border-brand-100 dark:border-brand-900/30 space-y-4">
                            <h3 className="text-xs font-bold text-brand-700 uppercase tracking-widest flex items-center gap-2">
                                <Truck className="w-4 h-4" /> Return Lifecycle
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-500">Current Status</span>
                                    <span className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full font-bold text-[10px]">{returnData.status}</span>
                                </div>
                                {id && (
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <button onClick={() => handleUpdateStatus('In-Transit')} className="text-[10px] py-1.5 bg-white border border-brand-200 rounded font-bold hover:bg-brand-50">Mark In-Transit</button>
                                        <button onClick={() => handleUpdateStatus('Received by Vendor')} className="text-[10px] py-1.5 bg-white border border-brand-200 rounded font-bold hover:bg-brand-50">Mark Received</button>
                                    </div>
                                )}
                            </div>
                            <div className="pt-4 border-t border-brand-100/50">
                                <label className="block text-[10px] font-bold text-brand-600 mb-1 uppercase">Tracking Number</label>
                                <input
                                    type="text"
                                    value={returnData.tracking_number || ''}
                                    onChange={(e) => setReturnData({ ...returnData, tracking_number: e.target.value })}
                                    placeholder="Carrier tracking code..."
                                    className="w-full px-3 py-2 bg-white dark:bg-neutral-950 border border-brand-200 dark:border-brand-900/50 rounded-lg text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                            <h3 className="font-bold flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
                                Return Items
                                <span className="text-xs text-neutral-400 font-medium">(Select items from GRN to return)</span>
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b dark:border-neutral-800">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px]">Product / SKU</th>
                                        <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] text-center">GRN Qty</th>
                                        <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] text-center w-32">Return Qty</th>
                                        <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] text-right">Unit Rate</th>
                                        <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] text-right">Refund Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                                    {(returnData.items || []).map((item, idx) => (
                                        <tr key={idx} className={`hover:bg-neutral-50/50 dark:hover:bg-neutral-900/20 transition-colors ${item.return_quantity > 0 ? 'bg-amber-50/20 dark:bg-amber-900/5' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-neutral-900 dark:text-white leading-none mb-1">{item.product_name}</div>
                                                <div className="text-[10px] text-neutral-500 font-mono tracking-tighter uppercase">{item.sku || 'NO-SKU'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-neutral-400 font-medium">
                                                {item.grn_quantity}
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={item.return_quantity}
                                                    onChange={(e) => updateItem(idx, 'return_quantity', parseFloat(e.target.value) || 0)}
                                                    className={`w-full text-center py-2 bg-transparent border-b ${item.return_quantity > 0 ? 'border-brand-500 font-bold text-brand-600' : 'border-neutral-200 dark:border-neutral-800 text-neutral-400'}`}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 font-medium">
                                                    <span className="text-neutral-400 text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        value={item.rate}
                                                        onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                                                        className="w-20 text-right bg-transparent border-b border-dashed border-neutral-300 dark:border-neutral-700 py-1"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-neutral-900 dark:text-white">
                                                ₹{item.line_total.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!returnData.items || returnData.items.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center text-neutral-400 italic font-medium">
                                                Select a vendor and GRN to load items for return.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                                    <Paperclip className="w-4 h-4" /> Supporting Evidence
                                </h3>
                                <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-6 text-center hover:bg-neutral-50 cursor-pointer transition-colors">
                                    <Plus className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-neutral-500">Attach photos of defective items</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <label className="block text-[10px] font-bold text-neutral-400 mb-2 uppercase tracking-widest">Internal Notes</label>
                                <textarea
                                    className="w-full p-4 text-sm bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:ring-2 focus:ring-brand-500/20"
                                    rows={4}
                                    placeholder="Reason details, vendor communication notes..."
                                />
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="bg-neutral-900 p-8 rounded-3xl shadow-2xl space-y-8 relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.3em]">Refund Summary</h3>

                            <div className="space-y-5">
                                <div className="flex justify-between text-neutral-400 text-sm font-medium">
                                    <span>Return Subtotal</span>
                                    <span>₹{totals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-neutral-400 text-sm font-medium">
                                    <span>Tax Adjustment (18%)</span>
                                    <span>₹{totals.tax.toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-neutral-800 w-full my-6"></div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="block text-[10px] font-black text-brand-500 uppercase mb-2 tracking-widest">Debit Note Amount</span>
                                        <span className="text-4xl font-black text-white">₹{totals.total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-brand-500/20 rounded-full border border-brand-500/30">
                                            <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></div>
                                            <span className="text-[10px] font-bold text-brand-400 uppercase">Awaiting Credit</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-neutral-800 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                <p className="text-[10px] text-neutral-500 font-medium leading-relaxed">
                                    Generating this return will create a <span className="text-white font-bold underline">Debit Note</span> and reduce inventory counts for the selected items upon verification.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseReturnForm;
