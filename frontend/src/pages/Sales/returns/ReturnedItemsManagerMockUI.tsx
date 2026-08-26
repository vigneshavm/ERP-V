import React, { useMemo } from 'react';
import { Filter, Search, Plus, Download, ChevronRight, BarChart2, RotateCcw, ShieldCheck, RefreshCw, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { inventory, customers, MockProduct, MockCustomer } from '../../../data';
import Layout from '../../../components/shared/Layout';

const ReturnedItemsManagerMockUI: React.FC = () => {
    const navigate = useNavigate();

    // Generate mock return records from real data
    const records = useMemo(() => {
        return (customers as MockCustomer[]).slice(0, 8).map((customer, i) => {
            const product = (inventory as MockProduct[])[i % inventory.length];
            const date = new Date();
            date.setDate(date.getDate() - (i * 3));
            
            return {
                id: `RMA-${1000 + i}`,
                date: date.toISOString().split('T')[0],
                customer: customer.name,
                product: product.name,
                reason: ['Damaged', 'Wrong Item', 'Defective', 'Expired'][i % 4],
                status: i % 3 === 0 ? 'QC Passed' : i % 3 === 1 ? 'QC Pending' : 'QC Rejected',
                action: i % 3 === 0 ? 'Stock Restored' : i % 3 === 1 ? 'Awaiting Insp' : 'Discarded',
                amount: (product.selling_price * 1.18).toFixed(2)
            };
        });
    }, []);

    const metrics = useMemo(() => {
        const totalValue = records.reduce((sum, r) => sum + parseFloat(r.amount), 0);
        return [
            { label: 'Total Returns', value: records.length, subValue: 'Cycle 12', status: 'warning', trend: '+12%' },
            { label: 'Return Amount', value: `₹${(totalValue/1000).toFixed(1)}K`, subValue: 'Gross Value', status: 'danger', trend: '+5%' },
            { label: 'QC Pass Rate', value: '72%', subValue: 'Full Restoration', status: 'success', trend: 'Optimal' },
            { label: 'Avg Process', value: '1.4d', subValue: 'Partial Cycle', status: 'warning', trend: '-0.2d' }
        ];
    }, [records]);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                            Returns <span className="text-warning">Intelligence</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Reverse Logistics Pipeline // Protocol R-7
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-3 uppercase">
                            <Download className="w-4 h-4 text-warning" /> Export RMA
                        </button>
                        <button className="h-12 px-8 bg-amber-500 text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-3 hover:opacity-90">
                            <Plus className="w-4 h-4" /> Log Return
                        </button>
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 rounded-sm p-6 border border-neutral-200 dark:border-neutral-800 relative overflow-hidden group hover:border-amber-500/50 transition-all cursor-pointer shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[9px] text-neutral-400 uppercase tracking-[0.2em] font-black">{stat.label}</p>
                                <div className={`p-2.5 rounded-sm border ${
                                    stat.status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                    stat.status === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                    'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                }`}>
                                    {stat.label.includes('Amount') ? <IndianRupee className="w-4 h-4" /> : 
                                     stat.label.includes('Rate') ? <ShieldCheck className="w-4 h-4" /> : 
                                     <RotateCcw className="w-4 h-4" />}
                                </div>
                            </div>
                            <h3 className="text-3xl font-display font-black text-neutral-900 dark:text-white tabular-nums">{stat.value}</h3>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{stat.subValue}</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${stat.status === 'success' ? 'text-emerald-500' : 'text-amber-500'}`}>{stat.trend}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-neutral-900 p-4 rounded-sm flex flex-col md:flex-row gap-6 items-center border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warning" />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY RETURN ID / CUSTOMER / SKU..." 
                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-12 pr-6 py-3.5 text-xs font-bold tracking-widest focus:border-amber-500/50 outline-none transition-all shadow-inner"
                        />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2 hover:bg-neutral-50 transition-all">
                            <Filter className="w-4 h-4" /> RMA Filters
                        </button>
                        <button className="h-12 px-6 bg-warning/10 text-warning border border-warning/20 rounded-sm text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-warning/20 transition-all">
                            <BarChart2 className="w-4 h-4" /> Analytics
                        </button>
                    </div>
                </div>

                {/* Data Grid */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm overflow-hidden flex flex-col shadow-sm">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950/80 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Return ID</th>
                                    <th className="px-8 py-5">Entity Path</th>
                                    <th className="px-8 py-5">Product/Reason</th>
                                    <th className="px-8 py-5">QC Status</th>
                                    <th className="px-8 py-5 text-right">Credit Value</th>
                                    <th className="px-8 py-5 text-center w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {records.map((rec, i) => (
                                    <tr key={i} className="hover:bg-amber-500/[0.02] transition-all group cursor-pointer">
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-black text-warning font-mono tracking-tighter">{rec.id}</div>
                                            <div className="text-[9px] text-neutral-400 font-black uppercase tracking-widest mt-1">{rec.date}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-black text-neutral-900 dark:text-white">{rec.customer}</div>
                                            <div className="text-[9px] text-neutral-400 font-black uppercase tracking-widest mt-1">Reg Client</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-black text-neutral-700 dark:text-neutral-300 truncate max-w-[200px]">{rec.product}</div>
                                            <div className="flex items-center gap-2 text-[9px] font-black text-amber-500 uppercase tracking-widest mt-1">
                                                <RefreshCw className="w-3 h-3" /> {rec.reason}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={`px-4 py-1.5 rounded-sm border text-[9px] font-black uppercase tracking-[0.1em] flex items-center gap-2 w-fit ${
                                                rec.status === 'QC Passed' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500' :
                                                rec.status === 'QC Pending' ? 'bg-amber-500/5 border-amber-500/10 text-amber-500' :
                                                'bg-rose-500/5 border-rose-500/10 text-rose-500'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full bg-current ${rec.status === 'QC Pending' ? 'animate-pulse' : ''}`} />
                                                {rec.status}
                                            </div>
                                            <div className="text-[9px] text-neutral-400 font-black uppercase tracking-widest mt-1 ml-1">{rec.action}</div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="text-sm font-mono font-black text-neutral-900 dark:text-white tracking-tighter">₹{parseFloat(rec.amount).toLocaleString()}</div>
                                            <div className="text-[9px] text-neutral-400 font-black uppercase tracking-widest mt-0.5">Automated Adjust</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-center">
                                                <button className="p-3 text-neutral-400 hover:text-white bg-neutral-50 dark:bg-neutral-800 hover:bg-warning rounded-sm transition-all shadow-sm border border-neutral-200 dark:border-neutral-700">
                                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            </div>
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

export default ReturnedItemsManagerMockUI;


