import React, { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, TrendingUp, TrendingDown, Users, AlertTriangle } from 'lucide-react';
import api from "@/shared/api/api";
import { useBranchResolver } from '../../hooks/useBranchResolver';

const PayableSnapshot: React.FC = () => {
    const { currentBranchId } = useBranchResolver();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            // Using the supplier reports endpoint which aggregates payables
            // Or use bills analytics
            const { data } = await api.get('/purchases/suppliers/reports');
            if (data && data.success) {
                // Determine overdue from the response (assuming structure from SupplierReportService)
                // If the structure matches what we saw in SupplierController:
                // payables: { totalPayables, totalOverdue, ... }, overdue: [list of overdue suppliers]
                setData(data.data);
            }
        } catch (err) {
            console.error("Failed to load snapshot", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentBranchId]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-neutral-900 text-white"><RefreshCw className="w-8 h-8 animate-spin" /></div>;
    }

    if (!data) {
        return <div className="p-4 text-center text-white">Failed to load data.</div>;
    }

    const { payables, overdue } = data;
    const totalPayable = payables?.totalPayables || 0;
    const totalOverdue = payables?.totalOverdue || 0;
    const topOverdueSuppliers = overdue || []; // Array of { businessName, totalAmount, ... }

    return (
        <div className="min-h-screen bg-neutral-900 text-white p-4 font-sans max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xs">P</div>
                    <h1 className="text-xl font-bold tracking-tight">Payable Snapshot</h1>
                </div>
                <button onClick={loadData} className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700">
                    <RefreshCw className="w-4 h-4 text-neutral-400" />
                </button>
            </div>

            {/* Main Cards */}
            <div className="space-y-4">
                {/* Total Outstanding */}
                <div className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl shadow-lg border border-indigo-500/30">
                    <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-indigo-200 tracking-wider">Total Payable</span>
                        <TrendingUp className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        ₹{totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-indigo-200 opacity-80">
                        Current liabilities across all suppliers
                    </div>
                </div>

                {/* Overdue Alert */}
                <div className="p-6 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-lg border border-red-500/30 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-red-200 tracking-wider flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3" /> Critical Overdue
                        </span>
                        <TrendingDown className="w-4 h-4 text-red-300" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        ₹{totalOverdue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-red-200 opacity-80">
                        Requires immediate attention
                    </div>
                </div>

                {/* Top Critical Suppliers */}
                <div className="mt-8">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Priority Payments
                    </h3>
                    <div className="space-y-3">
                        {topOverdueSuppliers.slice(0, 5).map((sup: any, idx: number) => (
                            <div key={idx} className="p-4 bg-neutral-800 rounded-xl border border-neutral-700/50 flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-sm text-neutral-200">{sup.supplierName || sup.businessName}</div>
                                    <div className="text-xs text-red-400 font-medium mt-0.5">{sup.daysOverdue || '0'} days overdue</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-white">₹{(sup.totalAmount || sup.amount || 0).toLocaleString()}</div>
                                    <button className="text-[10px] bg-white text-black font-bold px-2 py-1 rounded mt-1 hover:bg-neutral-200">
                                        PAY NOW
                                    </button>
                                </div>
                            </div>
                        ))}
                        {topOverdueSuppliers.length === 0 && (
                            <div className="p-8 text-center text-neutral-500 text-sm bg-neutral-800/50 rounded-xl border border-dashed border-neutral-800">
                                No critical overdue payments found.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <button className="text-xs font-bold text-neutral-500 hover:text-white transition-colors">
                    View Full Report
                </button>
            </div>
        </div>
    );
};

export default PayableSnapshot;
