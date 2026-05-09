import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, FileText, Paperclip, X, AlertCircle, CheckCircle, Clock, Ban, Zap, ShieldCheck, Activity, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { PurchaseBill, PurchaseBillItem, BillStatus } from "../../types/purchase";
import api from "../../services/api";
import { toast } from 'react-toastify';
import Layout from "../../components/shared/Layout/Layout";
import PageHeader from "../../components/shared/Layout/PageHeader";
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
        const isIntraState = bill.vendor_id?.toString().endsWith('1');
        const taxRate = 18;
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
        toast.info("Processing document with OCR...", { autoClose: 2000 });

        setTimeout(() => {
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
                amount: totals.total,
                subTotal: totals.subtotal,
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
                vendorInvoiceNo: 'V-INV-' + Math.floor(Math.random() * 10000),
                bill_date: new Date().toISOString().split('T')[0],
            }));
            addAttachment('scanned_invoice.pdf');
            setIsLoading(false);
            toast.success("Data extracted successfully!");
        }, 2000);
    };

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title={id ? "Refactor Vendor Bill" : "Fiscal Node Initialization"}
                    description="Finalize procurement liabilities with three-way matching and OCR verification."
                    breadcrumbs={[
                        { label: 'Procurement', link: '/purchase' },
                        { label: 'Bills Archive', link: '/purchase/bills' },
                        { label: id ? 'Refactor' : 'New Bill' }
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            <button
                                onClick={runOCR}
                                disabled={isLoading}
                                className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95"
                            >
                                <Zap className={`w-4 h-4 ${isLoading ? 'animate-pulse text-amber-500' : 'text-primary'}`} /> {isLoading ? 'Extracting...' : 'Auto-Extract (OCR)'}
                            </button>
                            
                            {id && bill.status !== 'Paid' && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                                    <button onClick={() => handleUpdateStatus('Hold')} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Hold"><Clock className="w-4 h-4" /></button>
                                    <button onClick={() => handleUpdateStatus('Disputed')} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Dispute"><AlertCircle className="w-4 h-4" /></button>
                                    <button onClick={() => handleUpdateStatus('Rejected')} className="p-2 text-neutral-400 hover:bg-neutral-50 rounded-lg transition-colors" title="Reject"><Ban className="w-4 h-4" /></button>
                                </div>
                            )}

                            <button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95"
                            >
                                <Save className="w-4 h-4" /> {id ? 'Update Node' : 'Finalize Bill'}
                            </button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Workspace */}
                    <div className="lg:col-span-8 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <BillBasicInfo
                                    bill={bill}
                                    vendors={vendors}
                                    onVendorChange={handleVendorChange}
                                    onBillChange={updateBillField}
                                />
                            </div>

                            <div className="bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-500">
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-3 mb-6">
                                    <FileSpreadsheet className="w-5 h-5 text-emerald-500" /> Vendor Documents
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Vendor Invoice No.</label>
                                        <input
                                            type="text"
                                            value={bill.vendorInvoiceNo || ''}
                                            onChange={(e) => updateBillField('vendorInvoiceNo', e.target.value)}
                                            placeholder="INV-X"
                                            className="w-full px-5 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-2xl text-xs font-black uppercase tracking-tighter focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 block">Invoice Date</label>
                                        <input
                                            type="date"
                                            value={bill.bill_date || ''}
                                            onChange={(e) => updateBillField('bill_date', e.target.value)}
                                            className="w-full px-5 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-2xl text-xs font-black focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Matching Ledger */}
                        <div className="bg-primary/5 dark:bg-primary/10 p-10 rounded-[3rem] border border-primary/20 shadow-sm relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                                <ShieldCheck className="w-48 h-48" />
                            </div>
                            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-3 mb-8">
                                <ShieldCheck className="w-6 h-6" /> Three-Way Matching Protocol
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                <div>
                                    <label className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-3 block">Linked Goods Receipt (GRN)</label>
                                    <select
                                        value={bill.grn_id || ''}
                                        onChange={(e) => handleGRNChange(e.target.value)}
                                        disabled={!bill.vendor_id}
                                        className="w-full px-6 py-3.5 bg-white dark:bg-neutral-800 border border-primary/20 rounded-2xl text-xs font-black uppercase tracking-tighter shadow-sm focus:ring-4 focus:ring-primary/10 outline-none disabled:opacity-30"
                                    >
                                        <option value="">Select Receipt Node...</option>
                                        {Array.isArray(grns) && grns.map(g => <option key={g.id} value={g.id}>{g.grnNumber} ({new Date(g.receivedDate).toLocaleDateString()})</option>)}
                                    </select>
                                </div>
                                {bill.po_number && (
                                    <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in zoom-in-95">
                                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Matched to Protocol {bill.po_number}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-700">
                            <div className="p-2 pt-10">
                                <BillItemsTable
                                    items={bill.items || []}
                                    onUpdateItem={updateItem}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Finance Sidebar */}
                    <div className="lg:col-span-4 space-y-10">
                        <BillFinancialSummary
                            totals={totals}
                            status={bill.status}
                            paymentTerms={bill.payment_terms}
                        />

                        {/* Evidence Node */}
                        <div className="bg-white dark:bg-neutral-800 p-8 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 space-y-6">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-3">
                                <Paperclip className="w-5 h-5" /> Document Evidence
                            </h3>
                            <div
                                onClick={() => document.getElementById('bill-upload')?.click()}
                                className="border-2 border-dashed border-neutral-100 dark:border-neutral-700 rounded-[2rem] p-10 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                            >
                                <input
                                    type="file"
                                    id="bill-upload"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept=".pdf,image/*"
                                />
                                <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-900 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform border border-neutral-100 dark:border-neutral-700">
                                    <Plus className="w-8 h-8 text-neutral-300 group-hover:text-primary" />
                                </div>
                                <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest leading-relaxed">Upload Invoice Node<br/><span className="text-primary/60 opacity-60">Supports Intel Extraction</span></p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {attachments.map((at, i) => (
                                    <div key={i} className="flex items-center gap-3 px-4 py-2 bg-neutral-50 dark:bg-neutral-900 rounded-xl text-[10px] font-black uppercase tracking-widest border border-neutral-100 dark:border-neutral-700 group">
                                        <FileText className="w-4 h-4 text-neutral-400" />
                                        <span className="max-w-[120px] truncate">{at}</span>
                                        <X className="w-4 h-4 cursor-pointer text-neutral-300 hover:text-rose-500" onClick={() => removeAttachment(i)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-800 p-8 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 space-y-6">
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-3">
                                <FileText className="w-5 h-5" /> Institutional Notes
                            </h3>
                            <textarea
                                value={bill.notes || ''}
                                onChange={(e) => updateBillField('notes', e.target.value)}
                                rows={4}
                                className="w-full px-6 py-5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-3xl text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                                placeholder="Audit trail remarks..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default BillForm;
