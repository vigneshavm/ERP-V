import React, { useState, useMemo } from 'react';
import { Save, Printer, FileText, Calendar, Truck, Paperclip, CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { SupplierSelectorFeature } from '@/features/purchase/supplier-selector';
import { PurchaseItemsTable, usePurchaseItemsManager, DesignSetModal, LotDistributionModal, DesignSet } from '@/features/purchase/purchase-items-manager';
import { useTaxIntelligence } from '@/features/purchase/tax-intelligence';
import { Supplier, PurchaseOrder, TaxBreakdown } from "@vignesh-erp/shared-kernel";

interface PurchaseFormProps {
    onSave: (data: Partial<PurchaseOrder>) => Promise<void>;
    isSubmitting?: boolean;
}

const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const s = num.toString();
    if (s.length > 9) return 'Value too large';
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

const PurchaseForm: React.FC<PurchaseFormProps> = ({ onSave, isSubmitting = false }) => {
    // Local State
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [header, setHeader] = useState({
        po_number: `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
        po_date: new Date().toISOString().split('T')[0],
        expected_delivery: '',
        reference_number: '',
        notes: '',
        terms_and_conditions: 'Standard 30-day payment terms apply.'
    });

    const [shippingAmount, setShippingAmount] = useState(0);
    const [extraDiscount, setExtraDiscount] = useState(0);

    // Modals orchestration
    const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);
    const [isLotModalOpen, setIsLotModalOpen] = useState(false);

    // Features integration
    const { items, addItem, updateItem, removeItem, expandDesignSet, totals } = usePurchaseItemsManager([]);
    const { breakdown, isInterState } = useTaxIntelligence(selectedSupplier, totals.tax);

    const grandTotal = useMemo(() => {
        return totals.total + shippingAmount - extraDiscount;
    }, [totals.total, shippingAmount, extraDiscount]);

    const amountInWords = useMemo(() => numberToWords(Math.round(grandTotal)), [grandTotal]);

    const handleSave = async (status: string) => {
        if (!selectedSupplier) return alert("Select a supplier first.");
        if (items.length === 0) return alert("Add at least one item.");

        await onSave({
            ...header,
            items: items as any, // Cast for matching kernel type if needed
            vendor_id: selectedSupplier._id,
            vendor_name: selectedSupplier.businessName,
            total_amount: grandTotal,
            tax_breakdown: breakdown,
            status: status as any
        });
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 p-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex-[3] space-y-8">
                {/* Header Card */}
                <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <SupplierSelectorFeature onSelect={setSelectedSupplier} />
                        </div>
                        
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">Fiscal Identity</label>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent">
                                    <FileText className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{header.po_number}</span>
                                </div>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="date" 
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-indigo-500 transition-all font-bold text-sm"
                                        value={header.po_date}
                                        onChange={(e) => setHeader({...header, po_date: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 px-1">Logistics & Proof</label>
                            <div className="flex flex-col gap-3">
                                <div className="relative">
                                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="date" 
                                        placeholder="Expected delivery..."
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-indigo-500 transition-all font-bold text-sm"
                                        value={header.expected_delivery}
                                        onChange={(e) => setHeader({...header, expected_delivery: e.target.value})}
                                    />
                                </div>
                                <div className="relative">
                                    <Paperclip className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Reference / Quotation #"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-transparent focus:border-indigo-500 transition-all font-bold text-sm"
                                        value={header.reference_number}
                                        onChange={(e) => setHeader({...header, reference_number: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Manager */}
                <PurchaseItemsTable 
                    items={items}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    onAdd={addItem}
                    onAddLot={() => setIsLotModalOpen(true)}
                    onViewHistory={(p) => alert(`Price history for ${p.product_name} coming soon.`)}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-lg">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                             <CheckCircle2 className="w-3 h-3" /> Operational Directives
                        </label>
                        <textarea 
                            className="w-full h-32 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                            placeholder="Specify internal instructions, quality standards, or urgent notes..."
                            value={header.notes}
                            onChange={(e) => setHeader({...header, notes: e.target.value})}
                        />
                    </div>
                    <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-lg">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                             <AlertCircle className="w-3 h-3" /> Agreement & Terms
                        </label>
                        <textarea 
                            className="w-full h-32 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                            placeholder="Payment windows, warranty expectations, return clauses..."
                            value={header.terms_and_conditions}
                            onChange={(e) => setHeader({...header, terms_and_conditions: e.target.value})}
                        />
                    </div>
                </div>

                <div className="flex justify-start gap-4">
                    <button 
                        onClick={() => setIsDesignModalOpen(true)}
                        className="px-8 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-3 shadow-lg"
                    >
                        <Save className="w-4 h-4" /> Procedural Expansion (Design Set)
                    </button>
                </div>
            </div>

            {/* Sidebar / Totals */}
            <div className="flex-1 space-y-8">
                <div className="bg-slate-900 dark:bg-indigo-950 text-white rounded-[2.5rem] p-10 shadow-2xl sticky top-8 flex flex-col gap-10">
                    <div className="flex items-center gap-4 justify-between">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/60">Financial Manifest</h4>
                         <div className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-tighter">
                             {isInterState ? 'Inter-state / IGST' : 'Intra-state / GST'}
                         </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                            <span className="text-xs font-bold text-indigo-200">Inventory Subtotal</span>
                            <span className="text-xl font-black">₹{totals.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                            <span className="text-xs font-bold text-indigo-200 text-rose-300">Catalog Discounts</span>
                            <span className="text-xl font-black text-rose-300">-₹{totals.discount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                            <span className="text-xs font-bold text-indigo-200">Strategic Taxes</span>
                            <span className="text-xl font-black">₹{totals.tax.toFixed(2)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pb-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-indigo-300/40">Logistics Cost</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-white/5 border-none rounded-xl p-3 text-sm font-black text-white focus:ring-2 focus:ring-indigo-400 transition-all"
                                    value={shippingAmount}
                                    onChange={(e) => setShippingAmount(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-rose-400/40">Rebate / Disc</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-white/5 border-none rounded-xl p-3 text-sm font-black text-white focus:ring-2 focus:ring-rose-400 transition-all"
                                    value={extraDiscount}
                                    onChange={(e) => setExtraDiscount(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex flex-col gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300/60">Final Valuation</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black tracking-tighter">₹{grandTotal.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-indigo-300">INR</span>
                            </div>
                            <p className="text-[10px] font-bold text-indigo-200/40 italic leading-relaxed mt-2 p-4 bg-black/20 rounded-2xl font-mono">
                                "{amountInWords}"
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-10 border-t border-white/10">
                        <button 
                            onClick={() => handleSave('Draft')}
                            className="w-full py-5 bg-white text-slate-900 rounded-[1.5rem] font-black text-sm shadow-xl shadow-white/10 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
                            disabled={isSubmitting}
                        >
                            <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            {isSubmitting ? 'Architecting...' : 'Save as Strategic Draft'}
                        </button>
                        <button 
                            onClick={() => handleSave('Approved')}
                            className="w-full py-5 bg-indigo-500 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-indigo-500/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
                            disabled={isSubmitting}
                        >
                             <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                             {isSubmitting ? 'Submitting...' : 'Approve & Create PO'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <DesignSetModal 
                isOpen={isDesignModalOpen}
                onClose={() => setIsDesignModalOpen(false)}
                onExpand={(ds) => expandDesignSet(ds)}
            />
            
            <LotDistributionModal 
                isOpen={isLotModalOpen}
                onClose={() => setIsLotModalOpen(false)}
                onConfirm={(ld) => {
                    // Handle lot logic: distribute ld.totalCost across ld.items based on ld.totalQty
                    const unitRate = ld.totalCost / ld.totalQty;
                    ld.items.forEach(i => {
                        addItem({
                            name: i.product_name,
                            rate: unitRate,
                            quantity: i.quantity,
                            sku: ld.lotNumber,
                            lot_number: ld.lotNumber
                        });
                    });
                }}
            />
        </div>
    );
};

export default PurchaseForm;
