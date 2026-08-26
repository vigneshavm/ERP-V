import React from 'react';
import { Clock } from 'lucide-react';
import { TaxBreakdown, BillStatus } from "../../../types/purchase";

interface FinancialTotals {
    subtotal: number;
    tax: number;
    total: number;
    tax_breakdown: TaxBreakdown & { other: number };
}

interface BillFinancialSummaryProps {
    totals: FinancialTotals;
    status: BillStatus | undefined;
    paymentTerms: string | undefined;
}

const BillFinancialSummary: React.FC<BillFinancialSummaryProps> = ({ totals, status, paymentTerms }) => {
    return (
        <div className="bg-neutral-900 dark:bg-black rounded-sm p-8 text-white shadow-2xl relative overflow-hidden">
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
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${status === 'Paid' ? 'bg-success/20 text-success' : 'bg-brand-500/20 text-brand-500'}`}>
                            {status}
                        </span>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-neutral-800">
                    <div className="flex items-center gap-3 text-brand-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold">Expect Payment: {paymentTerms}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillFinancialSummary;
