import React from 'react';
import { BarChart2, TrendingUp, TrendingDown, Download, Filter, Search, PieChart, FileText, Package, ShoppingCart, DollarSign, ArrowRight } from 'lucide-react';

const ReportsMockUI: React.FC = () => {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-primary/30 overflow-hidden flex flex-col transition-colors">
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[30%] w-[45%] h-[45%] bg-sky-700/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-[0%] right-[0%] w-[35%] h-[35%] bg-blue-700/10 rounded-full blur-[140px]" />
            </div>
            <main className="relative z-10 flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-8 py-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                            Business Intelligence
                            <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                                <BarChart2 className="w-3 h-3" /> Reports Hub
                            </span>
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-bold">Comprehensive analytics across sales, purchase, inventory, and finance.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-11 px-6 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-bold text-sm tracking-wide rounded-xl transition-all border border-neutral-200 dark:border-neutral-800 flex items-center gap-2 shadow-sm">
                            <Filter className="w-4 h-4" /> Date Range
                        </button>
                        <button className="h-11 px-6 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-sm shadow-primary/20 flex items-center gap-2">
                            <Download className="w-4 h-4" /> Export All
                        </button>
                    </div>
                </header>

                {/* KPI Summary */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Revenue (MTD)', val: '₹1.84Cr', sub: '+18.2% vs last month', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
                        { label: 'Total Purchases (MTD)', val: '₹68.4L', sub: '-4.1% vs last month', icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
                        { label: 'Gross Profit', val: '₹1.16Cr', sub: '63% gross margin', icon: DollarSign, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
                        { label: 'Inventory Value', val: '₹2.41Cr', sub: '1,840 active SKUs', icon: Package, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
                    ].map((card, i) => (
                        <div key={i} className={`bg-white dark:bg-neutral-900 rounded-2xl p-6 border ${card.border} group hover:border-primary/50 transition-all cursor-pointer shadow-sm`}>
                            <div className={`p-3 rounded-xl ${card.bg} ${card.color} w-fit mb-4`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">{card.label}</p>
                            <p className="text-2xl font-black tracking-tighter mt-1 text-neutral-900 dark:text-white">{card.val}</p>
                            <p className={`text-[10px] mt-1 font-bold ${card.color}`}>{card.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Report Category Grid */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    {[
                        { title: 'Sales Reports', desc: 'Invoice register, daybook, payment-in, outstanding dues', icon: ShoppingCart, color: 'sky', reports: ['Sales Invoice Register', 'Payment Received', 'Outstanding Dues', 'Customer Daybook'] },
                        { title: 'Purchase Reports', desc: 'Bills, GRN, supplier ageing, debit notes', icon: FileText, color: 'indigo', reports: ['Purchase Register', 'Supplier Ageing', 'GRN Summary', 'Debit Notes'] },
                        { title: 'Inventory Reports', desc: 'Stock movement, low stock, batch expiry, category-wise', icon: Package, color: 'amber', reports: ['Stock Summary', 'Stock Movement', 'Low Stock Alert', 'Batch Expiry'] },
                    ].map((sec, i) => (
                        <div key={i} className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 hover:border-primary/50 transition-all cursor-pointer group shadow-sm`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-3 rounded-xl bg-${sec.color}-500/10 text-${sec.color}-400`}>
                                    <sec.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-neutral-900 dark:text-white">{sec.title}</h3>
                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold mt-0.5">{sec.desc}</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                {sec.reports.map((r, ri) => (
                                    <button key={ri} className="flex items-center justify-between px-3 py-2 bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-neutral-900 dark:text-white transition-all group/btn">
                                        <span>{r}</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover/btn:text-primary transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Finance & Other Reports */}
                <div className="flex gap-6 flex-1">
                    {[
                        { title: 'Finance Reports', icon: DollarSign, color: 'emerald', reports: ['Cash & Bank Position', 'Fund Transfers', 'Bank Reconciliation', 'Journal Ledger', 'GST Summary'] },
                        { title: 'HR & Payroll', icon: BarChart2, color: 'violet', reports: ['Payroll Summary', 'Attendance Report', 'Salary Register', 'Leave Balance'] },
                        { title: 'GST & Tax', icon: PieChart, color: 'rose', reports: ['GSTR-1 Summary', 'GSTR-3B Preview', 'Input Tax Credit', 'E-Invoice Log'] },
                    ].map((sec, i) => (
                        <div key={i} className={`flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 hover:border-primary/50 transition-all shadow-sm`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2.5 rounded-xl bg-${sec.color}-500/10 text-${sec.color}-400`}>
                                    <sec.icon className="w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-black text-neutral-900 dark:text-white">{sec.title}</h3>
                            </div>
                            <div className="flex flex-col gap-2">
                                {sec.reports.map((r, ri) => (
                                    <button key={ri} className="flex items-center justify-between px-3 py-2 bg-neutral-50 dark:bg-neutral-950 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-bold text-neutral-900 dark:text-white transition-all group/btn">
                                        <span>{r}</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover/btn:text-primary transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default ReportsMockUI;
