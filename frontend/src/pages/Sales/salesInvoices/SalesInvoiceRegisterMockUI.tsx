import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, Plus, Download, ChevronRight, BarChart2 } from 'lucide-react';
import { salesInvoices, MockSalesInvoice } from '../../../data';
import Layout from '../../../components/shared/Layout';

const SalesInvoiceRegisterMockUI: React.FC = () => {
    const navigate = useNavigate();

    // Derive data from real sales invoices
    const invoiceList = useMemo(() => {
        return (salesInvoices as MockSalesInvoice[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, []);

    const metrics = useMemo(() => {
        const totalSales = invoiceList.reduce((sum, inv) => sum + inv.total, 0);
        const activeCount = invoiceList.length;
        const totalTax = invoiceList.reduce((sum, inv) => sum + (inv.total * 0.18), 0); // Simulated tax

        return [
            { label: "Total Revenue", value: `₹${totalSales.toLocaleString()}` },
            { label: "Active Invoices", value: `${activeCount}` },
            { label: "GST Collected", value: `₹${totalTax.toLocaleString()}` },
            { label: "Growth Rate", value: "+14.2%" }
        ];
    }, [invoiceList]);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-display font-black tracking-tighter text-neutral-900 dark:text-white">
                            Sales Invoice <span className="text-warning">Register</span>
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                            Cyber-Carbon Data Grid Workspace // Protocol V4
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-xs font-bold shadow-sm">
                            <Download className="w-4 h-4 text-warning" /> Statement Export
                        </button>
                        <button 
                            onClick={() => navigate('/sales/invoice/new')}
                            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white border border-amber-600 rounded-sm hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all text-xs font-black uppercase tracking-widest"
                        >
                            <Plus className="w-4 h-4" /> Issue Invoice
                        </button>
                    </div>
                </div>

                {/* Micro-Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 rounded-sm p-6 border border-neutral-200 dark:border-neutral-800 relative overflow-hidden group hover:border-amber-500/50 transition-all cursor-pointer shadow-sm">
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-black uppercase tracking-[0.2em]">{stat.label}</p>
                            <p className="text-2xl font-display font-black text-neutral-900 dark:text-white tabular-nums mt-1">{stat.value}</p>
                            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500"></div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-warning" />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY INVOICE ID / CUSTOMER REFERENCE..." 
                            className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm pl-14 pr-6 py-4 text-xs font-bold tracking-widest placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-amber-500/50 outline-none transition-all shadow-inner"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400">
                            <Filter className="w-4 h-4" /> Grid Options
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-warning/10 text-warning border border-warning/20 rounded-sm hover:bg-warning/20 transition-all text-[10px] font-black uppercase tracking-widest">
                            <BarChart2 className="w-4 h-4" /> Analytics
                        </button>
                    </div>
                </div>

                {/* Data Grid */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm overflow-hidden flex flex-col shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950/50 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 z-20">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Invoice ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Origin Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Customer Path</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 text-right">Settlement</th>
                                    <th className="px-8 py-5 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white/[0.01]">
                                {invoiceList.map((inv, i) => (
                                    <tr 
                                        key={i} 
                                        onClick={() => navigate(`/sales/invoice/${inv.invoice_no}`)}
                                        className="hover:bg-amber-500/[0.02] transition-all cursor-pointer group"
                                    >
                                        <td className="px-8 py-6">
                                            <span className="font-mono text-sm font-bold text-warning group-hover:underline cursor-pointer tracking-tighter">#{inv.invoice_no}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-200">{inv.date}</div>
                                            <div className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">Verified Sync</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-black text-neutral-900 dark:text-white group-hover:translate-x-1 transition-transform inline-block">{inv.customer_name}</div>
                                            <div className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1">B2B Institutional</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${
                                                inv.status === 'Paid' ? 'bg-success/10 text-success border-success/20' :
                                                inv.status === 'Partial' ? 'bg-warning/10 text-warning border-warning/20' :
                                                'bg-danger/10 text-danger border-danger/20'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${
                                                    inv.status === 'Paid' ? 'bg-emerald-500' :
                                                    inv.status === 'Partial' ? 'bg-amber-500' :
                                                    'bg-rose-500'
                                                }`} />
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="text-lg font-mono font-black text-neutral-900 dark:text-white tracking-tighter">₹{inv.total.toLocaleString()}</div>
                                            <div className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-0.5">NET PAYABLE</div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="w-10 h-10 rounded-sm flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                                                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    <div className="p-8 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex justify-between items-center text-[10px] text-neutral-500 mt-auto">
                        <p className="font-black uppercase tracking-[0.3em]">
                            Visualizing <span className="text-warning font-black">{invoiceList.length.toString().padStart(2, '0')}</span> of <span className="text-neutral-900 dark:text-white">{invoiceList.length}</span> Total Records
                        </p>
                        <div className="flex gap-3">
                            <button className="px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm font-black uppercase tracking-widest text-neutral-400 disabled:opacity-30 transition-all" disabled>Prev</button>
                            <button className="px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm font-black uppercase tracking-widest text-warning hover:border-amber-500/50 transition-all shadow-sm">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SalesInvoiceRegisterMockUI;

