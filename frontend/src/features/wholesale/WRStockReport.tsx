import React, { useEffect, useState } from 'react';
import { Loader2, Package } from 'lucide-react';
import api from '../../services/api';
import Layout from '../../components/shared/Layout/index';
import PageHeader from '../../components/shared/Layout/PageHeader';

interface StockRow {
    _id: string;
    name: string;
    quantitySold: number;
    totalSaleValue: number;
    currentStockQty: number | null;
    wholesaleRate: number | null;
}

/**
 * Wholesale/Retail (WR) Billing: WR stock report -- quantity sold per item through the
 * wholesale channel, alongside each item's current stock and wholesale rate. See
 * WholesaleReportController.ts's getWholesaleStockReport.
 */
const WRStockReport: React.FC = () => {
    const [rows, setRows] = useState<StockRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/sales-invoice/wholesale/reports/stock')
            .then(({ data }) => setRows(data?.rows || []))
            .catch(() => setRows([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader title="Wholesale Stock Report" description="Wholesale/Retail Billing / Stock Report" />
                <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-neutral-100 dark:border-neutral-700 text-neutral-400">
                                    <th className="px-6 py-4 font-semibold">Item</th>
                                    <th className="px-6 py-4 font-semibold text-right">Qty Sold (Wholesale)</th>
                                    <th className="px-6 py-4 font-semibold text-right">Sale Value</th>
                                    <th className="px-6 py-4 font-semibold text-right">Wholesale Rate</th>
                                    <th className="px-6 py-4 font-semibold text-right">Current Stock</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-12 text-center text-neutral-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading...</td></tr>
                                ) : rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 text-neutral-400">
                                                <Package className="w-8 h-8" />
                                                <p className="font-medium">No wholesale sales recorded yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : rows.map(r => (
                                    <tr key={r._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                                        <td className="px-6 py-4 font-medium">{r.name || 'Unknown Item'}</td>
                                        <td className="px-6 py-4 text-right font-semibold">{r.quantitySold}</td>
                                        <td className="px-6 py-4 text-right">₹{r.totalSaleValue?.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-violet-600">{r.wholesaleRate != null ? `₹${r.wholesaleRate.toFixed(2)}` : '—'}</td>
                                        <td className="px-6 py-4 text-right">{r.currentStockQty != null ? r.currentStockQty : '—'}</td>
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

export default WRStockReport;
