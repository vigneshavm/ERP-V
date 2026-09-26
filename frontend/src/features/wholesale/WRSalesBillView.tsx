import React, { useEffect, useState } from 'react';
import { Loader2, FileText } from 'lucide-react';
import api from '../../services/api';
import Layout from '../../components/shared/Layout/index';
import PageHeader from '../../components/shared/Layout/PageHeader';
import StatusBadge from '@/components/shared/UI/StatusBadge';

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
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400">
                                    <th className="px-6 py-4 font-semibold">Bill No.</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Customer</th>
                                    <th className="px-6 py-4 font-semibold">Counter</th>
                                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-right">Paid</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {loading ? (
                                    <tr><td colSpan={7} className="py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading...</td></tr>
                                ) : invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                                <FileText className="w-8 h-8" />
                                                <p className="font-medium">No wholesale bills yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : invoices.map(inv => (
                                    <tr key={inv._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="px-6 py-4 font-bold text-primary">{inv.invoiceNo}</td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{inv.customer?.name || 'Walk-in'}</td>
                                        <td className="px-6 py-4 text-slate-500">{inv.counterName || '—'}</td>
                                        <td className="px-6 py-4 text-right font-semibold">₹{inv.totalAmount?.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-success">₹{inv.paidAmount?.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={inv.paymentStatus} />
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
