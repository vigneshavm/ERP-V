
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus, Search, FileText, Paperclip, X, AlertCircle, CheckCircle, Clock, Ban } from 'lucide-react';
import { PurchaseBill, PurchaseBillItem, TaxBreakdown, BillStatus, GRN, PurchaseOrder } from "../../types/purchase";
import api from "../../services/api";
import { toast } from 'react-toastify';

interface Props {
    onBack?: () => void;
    onSave?: (bill: Partial<PurchaseBill>) => Promise<void>;
    initialData?: PurchaseBill | null;
}

const BillForm: React.FC<Props> = ({ onBack, onSave = async () => { }, initialData }) => {
    const { id, grnId } = useParams<{ id?: string, grnId?: string }>();
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) onBack();
        else navigate('/purchase/bills');
    };
    const [bill, setBill] = useState<Partial<PurchaseBill>>({
        bill_date: new Date().toISOString().split('T')[0],
        status: 'Received',
        amount: 0,
        total_amount: 0,
        tax_breakdown: { cgst: 0, sgst: 0, igst: 0, vat: 0, other: 0 },
        payment_terms: 'Net 30',
        due_date: '',
        attachments: [],
        items: [] as any
    });

    const [vendors, setVendors] = useState<any[]>([]);
    const [pos, setPos] = useState<PurchaseOrder[]>([]);
    const [grns, setGrns] = useState<GRN[]>([]);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch Bill if ID exists
    useEffect(() => {
        if (id) {
            const fetchBill = async () => {
                try {
                    const { data } = await api.get(`/api/bills/${id}`);
                    setBill(data);
                    setAttachments(data.attachments || []);
                } catch (err) {
                    console.error("Failed to fetch bill", err);
                    toast.error("Failed to load bill details");
                }
            };
            fetchBill();
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

    // Fetch POs and GRNs when vendor is selected
    useEffect(() => {
        if (!bill.vendor_id) return;
        const fetchData = async () => {
            try {
                const [poRes, grnRes] = await Promise.all([
                    api.get(`/api/purchases?vendorId=${bill.vendor_id}`),
                    api.get(`/api/grns?vendorId=${bill.vendor_id}`)
                ]);
                setPos(poRes.data || []);
                const fetchedGrns = grnRes.data || [];
                setGrns(fetchedGrns);

                // If grnId was provided in URL, auto-select it once grns are loaded
                if (grnId && !bill.grn_id) {
                    const targetGrn = fetchedGrns.find((g: any) => g.id === grnId || g._id === grnId);
                    if (targetGrn) {
                        handleGRNChange(grnId, fetchedGrns, poRes.data || []);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch POs/GRNs", err);
            }
        };
        fetchData();
    }, [bill.vendor_id, grnId]);

    useEffect(() => {
        if (initialData) {
            setBill(initialData);
            setAttachments(initialData.attachments || []);
        }
    }, [initialData]);

    const handleVendorChange = (vendorId: string) => {
        const vendor = vendors.find(v => v.id === vendorId || v._id === vendorId);
        setBill(prev => ({
            ...prev,
            vendor_id: vendorId,
            vendor_name: vendor?.businessName || vendor?.name || '',
            po_id: undefined,
            grn_id: undefined,
            items: []
        }));
    };

    const handleGRNChange = (selectedGrnId: string, availableGrns = grns, availablePos = pos) => {
        const grn = availableGrns.find(g => g.id === selectedGrnId || (g as any)._id === selectedGrnId);
        if (grn) {
            // Map GRN items to Bill items
            const billItems: PurchaseBillItem[] = grn.items.map(item => ({
                id: Math.random().toString(36).substr(2, 9),
                product_id: item.productId,
                product_name: item.productName,
                sku: item.sku,
                grn_quantity: item.acceptedQty,
                bill_quantity: item.acceptedQty,
                grn_rate: 0, // Need to fetch from PO if possible
                bill_rate: 0,
                tax_percent: 0,
                discount_amount: 0,
                line_total: 0,
                variance_flag: false
            }));

            // Sync with PO if available
            const linkedPO = pos.find(p => p.id === grn.poId || p.po_number === grn.poNumber);
            if (linkedPO) {
                billItems.forEach(bi => {
                    const poItem = linkedPO.items.find(pi => pi.product_id === bi.product_id || pi.sku === bi.sku);
                    if (poItem) {
                        bi.grn_rate = poItem.rate;
                        bi.bill_rate = poItem.rate;
                        bi.tax_percent = poItem.tax_percent;
                        bi.line_total = bi.bill_quantity * bi.bill_rate;
                    }
                });
            }

            setBill(prev => ({
                ...prev,
                grn_id: selectedGrnId,
                grn_number: grn.grnNumber,
                po_id: grn.poId,
                po_number: grn.poNumber,
                items: billItems as any
            }));
        }
    };

    const updateItem = (index: number, field: keyof PurchaseBillItem, value: any) => {
        const newItems = [...(bill.items || [])] as PurchaseBillItem[];
        const item = { ...newItems[index], [field]: value };

        // Calculate totals and variance
        if (field === 'bill_quantity' || field === 'bill_rate') {
            item.line_total = item.bill_quantity * item.bill_rate;
            item.variance_flag = item.bill_rate !== item.grn_rate || item.bill_quantity !== item.grn_quantity;
        }

        newItems[index] = item;
        setBill(prev => ({ ...prev, items: newItems as any }));
    };

    // Totals Calculation
    const totals = useMemo(() => {
        const items = (bill.items || []) as PurchaseBillItem[];
        const subtotal = items.reduce((sum, item) => sum + (item.line_total || 0), 0);

        // Mock tax calculation based on segments
        const isIntraState = bill.vendor_id?.toString().endsWith('1'); // Placeholder logic
        const taxRate = 18; // Default 18%
        const totalTax = (subtotal * taxRate) / 100;

        const tax_breakdown = isIntraState
            ? { cgst: totalTax / 2, sgst: totalTax / 2, igst: 0, vat: 0, other: 0 }
            : { cgst: 0, sgst: 0, igst: totalTax, vat: 0, other: 0 };

        return {
            subtotal,
            tax: totalTax,
            total: subtotal + totalTax,
            tax_breakdown
        };
    }, [bill.items, bill.vendor_id]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAttachments(prev => [...prev, file.name]);

        // Mock OCR Logic
        toast.info("Processing document with OCR...", { autoClose: 2000 });

        setTimeout(() => {
            // Simulate extracting amount and perhaps bill number
            const mockAmount = Math.floor(Math.random() * 50000) + 1000;
            const mockBillNo = `OCR-${Math.floor(Math.random() * 9000) + 1000}`;

            setBill(prev => ({
                ...prev,
                bill_number: prev.bill_number || mockBillNo,
                // We don't override the total_amount directly as it's computed, 
                // but in a real scenario we might flag a mismatch if the OCR total differs from the item sum.
            }));

            toast.success("OCR: Extracted Bill Details");
        }, 2500);
    };

    const handleSave = async () => {
        if (!bill.bill_number || !bill.vendor_id) {
            toast.warning("Bill Number and Vendor are required");
            return;
        }
        setIsLoading(true);
        try {
            await onSave({
                ...bill,
                amount: totals.subtotal,
                total_amount: totals.total,
                tax_breakdown: totals.tax_breakdown
            });
            toast.success(id ? "Bill updated successfully" : "Bill created successfully");
        } catch (err) {
            console.error("Save failed", err);
            toast.error("Failed to save bill");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: BillStatus) => {
        if (!id) return;
        setIsLoading(true);
        try {
            await api.put(`/api/bills/${id}/status`, { status: newStatus });
            setBill(prev => ({ ...prev, status: newStatus }));
            toast.success(`Bill marked as ${newStatus}`);
        } catch (err) {
            console.error("Status update failed", err);
            toast.error("Failed to update status");
        } finally {
            setIsLoading(false);
        }
    };

    const runOCR = () => {
        setIsLoading(true);
        toast.info("Extracting data from document...");
        setTimeout(() => {
            setBill(prev => ({
                ...prev,
                bill_number: 'INV-' + Math.floor(Math.random() * 1000000),
                bill_date: new Date().toISOString().split('T')[0],
            }));
            setAttachments(prev => [...prev, 'scanned_invoice.pdf']);
            setIsLoading(false);
            toast.success("Data extracted successfully!");
        }, 2000);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Top Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
                <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Record Vendor Bill</h2>
                        <p className="text-xs text-neutral-500 font-medium tracking-tight">Purchase Bill & Three-Way Matching</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={runOCR}
                        className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-primary font-bold text-xs rounded-lg hover:bg-neutral-200 transition-colors uppercase"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Auto-Extract (OCR)'}
                    </button>
                    {id && bill.status !== 'Paid' && (
                        <div className="flex items-center gap-2 mr-2 pr-4 border-r border-neutral-200 dark:border-neutral-800">
                            <button
                                onClick={() => handleUpdateStatus('Hold')}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-amber-200"
                                title="Put on Hold"
                            >
                                <Clock className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleUpdateStatus('Disputed')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                                title="Dispute Bill"
                            >
                                <AlertCircle className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleUpdateStatus('Rejected')}
                                className="p-2 text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors border border-neutral-200"
                                title="Reject"
                            >
                                <Ban className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-lg shadow-brand-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" /> {isLoading ? 'Saving...' : id ? 'Update Bill' : 'Finalize Bill'}
                    </button>
                    <button onClick={handleBack} className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400 font-semibold text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                        Cancel
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Main Bill Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-6 md:col-span-2">
                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
                                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Basic Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 mb-2">Vendor / Supplier</label>
                                        <select
                                            value={bill.vendor_id || ''}
                                            onChange={(e) => handleVendorChange(e.target.value)}
                                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                                        >
                                            <option value="">Select Vendor</option>
                                            {vendors.map(v => <option key={v._id || v.id} value={v._id || v.id}>{v.businessName || v.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 mb-2">Bill Number</label>
                                        <input
                                            type="text"
                                            value={bill.bill_number || ''}
                                            onChange={(e) => setBill({ ...bill, bill_number: e.target.value })}
                                            placeholder="INV-2024-001"
                                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 mb-2">Bill Date</label>
                                        <input
                                            type="date"
                                            value={bill.bill_date}
                                            onChange={(e) => setBill({ ...bill, bill_date: e.target.value })}
                                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-neutral-500 mb-2">Due Date</label>
                                        <input
                                            type="date"
                                            value={bill.due_date || ''}
                                            onChange={(e) => setBill({ ...bill, due_date: e.target.value })}
                                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Linkage Panel */}
                        <div className="space-y-6">
                            <div className="bg-brand-50/30 dark:bg-brand-900/10 p-6 rounded-2xl border border-brand-100 dark:border-brand-900/30 shadow-sm space-y-6">
                                <h3 className="text-sm font-bold text-brand-700 dark:text-brand-400 uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Three-Way Matching
                                </h3>
                                <div>
                                    <label className="block text-xs font-bold text-brand-600/60 mb-2 uppercase">Linked Goods Receipt (GRN)</label>
                                    <select
                                        value={bill.grn_id || ''}
                                        onChange={(e) => handleGRNChange(e.target.value)}
                                        disabled={!bill.vendor_id}
                                        className="w-full px-4 py-3 bg-white dark:bg-neutral-950 border border-brand-200 dark:border-brand-900/50 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
                                    >
                                        <option value="">Select GRN</option>
                                        {grns.map(g => <option key={g.id} value={g.id}>{g.grnNumber} ({new Date(g.receivedDate).toLocaleDateString()})</option>)}
                                    </select>
                                    {bill.po_number && (
                                        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-brand-500/5 rounded-lg border border-brand-500/10">
                                            <CheckCircle className="w-3.5 h-3.5 text-brand-600" />
                                            <span className="text-[10px] font-bold text-brand-700">Matched to {bill.po_number}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-4 border-t border-brand-100 dark:border-brand-900/20">
                                    <div className="flex items-center justify-between text-xs font-medium text-brand-700 mb-2">
                                        <span>Matching Status</span>
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">Auto-Linked</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                Invoice Items
                                <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-[10px] rounded-lg text-neutral-500">{(bill.items || []).length} items</span>
                            </h3>
                            <button className="text-brand-600 text-xs font-bold hover:underline flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" /> Force Add Item
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b dark:border-neutral-800">
                                    <tr>
                                        <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px]">Product / Description</th>
                                        <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] w-28 text-center">GRN Qty</th>
                                        <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] w-32 text-center">Bill Qty</th>
                                        <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] w-32 text-right">PO Rate</th>
                                        <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] w-32 text-right">Bill Rate</th>
                                        <th className="px-6 py-4 font-bold text-neutral-500 uppercase text-[10px] w-32 text-right">Line Total</th>
                                        <th className="px-6 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/50 font-medium">
                                    {(bill.items || []).map((item: any, idx: number) => (
                                        <tr key={idx} className={`group hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors ${item.variance_flag ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}>
                                            <td className="px-6 py-4">
                                                <div className="text-neutral-900 dark:text-white font-bold">{item.product_name}</div>
                                                <div className="text-[10px] text-neutral-500 font-mono">{item.sku || 'NO-SKU'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-neutral-500">
                                                {item.grn_quantity}
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="number"
                                                    value={item.bill_quantity}
                                                    onChange={(e) => updateItem(idx, 'bill_quantity', parseFloat(e.target.value) || 0)}
                                                    className={`w-full text-center py-1.5 bg-transparent border-b ${item.bill_quantity !== item.grn_quantity ? 'border-amber-500 text-amber-600' : 'border-neutral-200 dark:border-neutral-700'}`}
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right text-neutral-500">
                                                ₹{item.grn_rate?.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="text-neutral-400 text-xs">₹</span>
                                                    <input
                                                        type="number"
                                                        value={item.bill_rate}
                                                        onChange={(e) => updateItem(idx, 'bill_rate', parseFloat(e.target.value) || 0)}
                                                        className={`w-24 text-right py-1.5 bg-transparent border-b ${item.bill_rate !== item.grn_rate ? 'border-amber-500 text-amber-600' : 'border-neutral-200 dark:border-neutral-700'}`}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-neutral-900 dark:text-white">
                                                ₹{item.line_total?.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {item.variance_flag && (
                                                    <div className="relative group/tool">
                                                        <AlertCircle className="w-4 h-4 text-amber-500" />
                                                        <div className="absolute bottom-full right-0 mb-2 p-2 bg-neutral-900 text-white text-[10px] rounded opacity-0 group-hover/tool:opacity-100 pointer-events-none whitespace-nowrap z-30">
                                                            Variance Flagged: Rate/Qty mismatch
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!bill.items || bill.items.length === 0) && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-neutral-400 italic">
                                                Linked GRN to populate item details and perform variance analysis
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bottom Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
                        {/* Attachments & Notes */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                    <Paperclip className="w-4 h-4" /> Documents & OCR
                                </h3>
                                <div
                                    className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-8 text-center hover:border-brand-500/50 hover:bg-brand-500/5 transition-all cursor-pointer group"
                                >
                                    <input
                                        type="file"
                                        id="bill-upload"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        accept=".pdf,image/*"
                                    />
                                    <div onClick={() => document.getElementById('bill-upload')?.click()}>
                                        <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                            <Plus className="w-6 h-6 text-neutral-400 group-hover:text-brand-500" />
                                        </div>
                                        <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400">Click to upload Bill PDF/Image</p>
                                        <p className="text-xs text-neutral-500 mt-1">Supports OCR amount extraction (Experimental)</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {attachments.map((at, i) => (
                                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs border border-neutral-200 dark:border-neutral-700">
                                            <FileText className="w-3.5 h-3.5" /> {at} <X className="w-3 h-3 cursor-pointer" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Bill Notes
                                </h3>
                                <textarea
                                    value={bill.notes || ''}
                                    onChange={(e) => setBill({ ...bill, notes: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                                    placeholder="Any internal notes or dispute details..."
                                />
                            </div>
                        </div>

                        {/* Totals & Tax Summary */}
                        <div className="bg-neutral-900 dark:bg-black rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-[0.2em] mb-8">Financial Summary</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className="text-neutral-400">Subtotal</span>
                                    <span>₹{totals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-neutral-800 w-full my-4"></div>
                                <div className="space-y-3">
                                    <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">Tax Breakdown</div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-neutral-400">CGST</span>
                                            <span className="text-brand-400">₹{totals.tax_breakdown.cgst.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-neutral-400">SGST</span>
                                            <span className="text-brand-400">₹{totals.tax_breakdown.sgst.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-neutral-400">IGST</span>
                                            <span className="text-brand-400">₹{totals.tax_breakdown.igst.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-neutral-400">Other</span>
                                            <span className="text-brand-400">₹{totals.tax_breakdown.other.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-px bg-neutral-800 w-full my-6"></div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Total Payable</span>
                                        <span className="text-3xl font-black text-brand-500">₹{totals.total.toFixed(2)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Status</span>
                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${bill.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-brand-500/20 text-brand-500'}`}>
                                            {bill.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-neutral-800">
                                    <div className="flex items-center gap-3 text-brand-400">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs font-bold">Expect Payment: {bill.payment_terms}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillForm;
