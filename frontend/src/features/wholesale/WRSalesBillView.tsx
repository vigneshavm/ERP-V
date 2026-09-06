import React, { useEffect, useState } from 'react';
import { Loader2, FileText } from 'lucide-react';
import api from '../../services/api';
import Layout from '../../components/shared/Layout/index';
import PageHeader from '../../components/shared/Layout/PageHeader';

interface WRInvoiceRow {
    _id: string;
    invoiceNo: string;
    createdAt: string;
    customer?: { name?: string; phone?: string };
    counterName?: string;
    totalAmount: number;
    paidAmount: number;
    paymentStatus: string;
}

/**
 * Wholesale/Retail (WR) Billing: WR bill view & reporting.
 * Lists Invoice documents tagged saleChannel: 'WHOLESALE' -- see WholesaleReportController.ts.
 */
const WRSalesBillView: React.FC = () => {
    const [invoices, setInvoices] = useState<WRInvoiceRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/sales-invoice/wholesale/invoices')
            .then(({ data }) => setInvoices(data?.invoices || []))
            .catch(() => setInvoices([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader title="Wholesale Sales Bills" description="Wholesale/Retail Billing / Sales Bill View" />
                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-700 text-neutral-400">
                                    <th className="px-6 py-4 font-semibold">Bill No.</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Customer</th>
                                    <th className="px-6 py-4 font-semibold">Counter</th>
                                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-right">Paid</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                {loading ? (
                                    <tr><td colSpan={7} className="py-12 text-center text-neutral-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading...</td></tr>
                                ) : invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 text-neutral-400">
                                                <FileText className="w-8 h-8" />
                                                <p className="font-medium">No wholesale bills yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : invoices.map(inv => (
                                    <tr key={inv._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                                        <td className="px-6 py-4 font-bold text-primary">{inv.invoiceNo}</td>
                                        <td className="px-6 py-4 text-neutral-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{inv.customer?.name || 'Walk-in'}</td>
                                        <td className="px-6 py-4 text-neutral-500">{inv.counterName || '—'}</td>
                                        <td className="px-6 py-4 text-right font-semibold">₹{inv.totalAmount?.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-emerald-600">₹{inv.paidAmount?.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                inv.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                inv.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {inv.paymentStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default WRSalesBillView;
