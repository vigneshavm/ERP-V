
import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, FileText, Paperclip, X, AlertCircle, CheckCircle, Clock, Ban } from 'lucide-react';
import { PurchaseBill, PurchaseBillItem, BillStatus } from "@repo/shared-kernel";
import api from "@/shared/api/api";
import { toast } from 'react-toastify';
import BillBasicInfo from './Components/BillBasicInfo';
import BillItemsTable from './Components/BillItemsTable';
import BillFinancialSummary from './Components/BillFinancialSummary';
import { useBillData } from './hooks/useBillData';

interface Props {
    onBack?: () => void;
    onSave?: (bill: Partial<PurchaseBill>) => Promise<void>;
    initialData?: PurchaseBill | null;
}

const BillForm: React.FC<Props> = ({ onBack, onSave = async () => { }, initialData }) => {
    const { id, grnId } = useParams<{ id?: string, grnId?: string }>();
    const navigate = useNavigate();

    const {
        bill,
        setBill,
        vendors,
        grns,
        attachments,
        setAttachments,
        isLoading,
        setIsLoading,
        handleVendorChange,
        handleGRNChange,
        updateItem,
        updateBillField,
        addAttachment,
        removeAttachment
    } = useBillData(id, grnId, initialData);

    const handleBack = () => {
        if (onBack) onBack();
        else navigate('/purchase/bills');
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

        addAttachment(file.name);

        // Mock OCR Logic
        toast.info("Processing document with OCR...", { autoClose: 2000 });

        setTimeout(() => {
            // Simulate extracting amount and perhaps bill number
            const mockBillNo = `OCR-${Math.floor(Math.random() * 9000) + 1000}`;

            setBill(prev => ({
                ...prev,
                bill_number: prev.bill_number || mockBillNo,
            }));

            toast.success("OCR: Extracted Bill Details");
        }, 2500);
    };

    const handleSave = async () => {
        if (!bill.bill_number || !bill.vendor_id || !bill.vendorInvoiceNo) {
            toast.warning("Bill Number, Vendor Invoice No, and Vendor are required");
            return;
        }
        setIsLoading(true);
        try {
            await onSave({
                ...bill,
                amount: totals.total, // Total Payable
                subTotal: totals.subtotal,
                total_amount: totals.total, // Keep for compatibility if needed
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
                vendorInvoiceNo: 'V-INV-' + Math.floor(Math.random() * 10000),
                bill_date: new Date().toISOString().split('T')[0],
            }));
            addAttachment('scanned_invoice.pdf');
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
                            <BillBasicInfo
                                bill={bill}
                                vendors={vendors}
                                onVendorChange={handleVendorChange}
                                onBillChange={updateBillField}
                            />

                            {/* Vendor Invoice Details */}
                            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <FileText className="w-4 h-4" /> Vendor Documents
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500 uppercase">Vendor Invoice No.</label>
                                        <input
                                            type="text"
                                            value={bill.vendorInvoiceNo || ''}
                                            onChange={(e) => updateBillField('vendorInvoiceNo', e.target.value)}
                                            placeholder="e.g. INV-2024-001"
                                            className="w-full px-4 py-2 mt-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-neutral-500 uppercase">Invoice Date</label>
                                        <input
                                            type="date"
                                            value={bill.bill_date || ''}
                                            onChange={(e) => updateBillField('bill_date', e.target.value)}
                                            className="w-full px-4 py-2 mt-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg text-sm font-bold"
                                        />
                                    </div>
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
                <BillItemsTable
                    items={bill.items || []}
                    onUpdateItem={updateItem}
                />

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
                                        <FileText className="w-3.5 h-3.5" /> {at} <X className="w-3 h-3 cursor-pointer" onClick={() => removeAttachment(i)} />
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
                                onChange={(e) => updateBillField('notes', e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20"
                                placeholder="Any internal notes or dispute details..."
                            />
                        </div>
                    </div>

                    {/* Totals & Tax Summary */}
                    <BillFinancialSummary
                        totals={totals}
                        status={bill.status}
                        paymentTerms={bill.payment_terms}
                    />
                </div>
            </div>
        </div>
    );
};


export default BillForm;
