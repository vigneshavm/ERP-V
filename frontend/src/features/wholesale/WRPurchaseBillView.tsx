import React, { useEffect, useState } from 'react';
import { Loader2, Package } from 'lucide-react';
import api from '../../services/api';
import Layout from '../../components/shared/Layout/index';
import PageHeader from '../../components/shared/Layout/PageHeader';

interface WRPurchaseRow {
    _id: string;
    purchaseNumber: string;
    date: string;
    vendorId?: { businessName?: string };
    totalAmount: number;
    status: string;
}

/**
 * Wholesale/Retail (WR) Billing: WR purchase bill view.
 * Lists Purchase documents tagged channel: 'WHOLESALE' -- see PurchaseController.ts's
 * getAllPurchases ?channel filter.
 */
const WRPurchaseBillView: React.FC = () => {
    const [purchases, setPurchases] = useState<WRPurchaseRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/purchases', { params: { channel: 'WHOLESALE' } })
            .then(({ data }) => setPurchases(Array.isArray(data) ? data : data?.data || []))
            .catch(() => setPurchases([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in">
                <PageHeader title="Wholesale Purchase Bills" description="Wholesale/Retail Billing / Purchase Bill View" />
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400">
                                    <th className="px-6 py-4 font-semibold">Purchase No.</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Vendor</th>
                                    <th className="px-6 py-4 font-semibold text-right">Amount</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-12 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading...</td></tr>
                                ) : purchases.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                                <Package className="w-8 h-8" />
                                                <p className="font-medium">No wholesale purchases yet</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : purchases.map(p => (
                                    <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                        <td className="px-6 py-4 font-bold text-primary">{p.purchaseNumber}</td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(p.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{p.vendorId?.businessName || '—'}</td>
                                        <td className="px-6 py-4 text-right font-semibold">₹{p.totalAmount?.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                {p.status}
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

export default WRPurchaseBillView;
