import React, { useEffect, useState } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import Layout from '../../components/shared/Layout/index';
import PageHeader from '../../components/shared/Layout/PageHeader';

interface ReportData {
    summary: { invoiceCount: number; totalAmount: number; paidAmount: number };
    byDay: Array<{ _id: string; invoiceCount: number; totalAmount: number; paidAmount: number }>;
    byCounter: Array<{ _id: string; invoiceCount: number; totalAmount: number }>;
}

/**
 * Wholesale/Retail (WR) Billing: WR sales report -- daily totals + per-counter breakdown for
 * saleChannel: 'WHOLESALE' invoices. See WholesaleReportController.ts's getWholesaleSalesReport.
 */
const WRSalesReport: React.FC = () => {
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/sales-invoice/wholesale/reports/sales')
            .then(({ data }) => setReport(data))
            .catch(() => setReport(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader title="Wholesale Sales Report" description="Wholesale/Retail Billing / Sales Report" />

                {loading ? (
                    <div className="flex items-center justify-center py-20 text-neutral-400">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading report...
                    </div>
                ) : !report || report.summary.invoiceCount === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-20 text-neutral-400">
                        <TrendingUp className="w-8 h-8" />
                        <p className="font-medium">No wholesale sales recorded yet</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Total Bills</p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">{report.summary.invoiceCount}</p>
                            </div>
                            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Total Sales</p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">₹{report.summary.totalAmount.toFixed(2)}</p>
                            </div>
                            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-700">
                                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Total Collected</p>
                                <p className="text-2xl font-bold text-emerald-600 mt-1">₹{report.summary.paidAmount.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 font-bold text-neutral-700 dark:text-neutral-300">By Day</div>
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-neutral-100 dark:border-neutral-700 text-neutral-400">
                                            <th className="px-6 py-3 font-semibold">Date</th>
                                            <th className="px-6 py-3 font-semibold text-right">Bills</th>
                                            <th className="px-6 py-3 font-semibold text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                        {report.byDay.map(d => (
                                            <tr key={d._id}>
                                                <td className="px-6 py-3">{d._id}</td>
                                                <td className="px-6 py-3 text-right">{d.invoiceCount}</td>
                                                <td className="px-6 py-3 text-right font-semibold">₹{d.totalAmount.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 font-bold text-neutral-700 dark:text-neutral-300">By Counter</div>
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-neutral-100 dark:border-neutral-700 text-neutral-400">
                                            <th className="px-6 py-3 font-semibold">Counter</th>
                                            <th className="px-6 py-3 font-semibold text-right">Bills</th>
                                            <th className="px-6 py-3 font-semibold text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                        {report.byCounter.map(c => (
                                            <tr key={c._id}>
                                                <td className="px-6 py-3">{c._id}</td>
                                                <td className="px-6 py-3 text-right">{c.invoiceCount}</td>
                                                <td className="px-6 py-3 text-right font-semibold">₹{c.totalAmount.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default WRSalesReport;
