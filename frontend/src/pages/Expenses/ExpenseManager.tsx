import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "../../redux/store";
import Layout from "../../components/shared/Layout";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Receipt, TrendingDown, ArrowRight, History, Search, Filter, Download } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const ExpenseManagerPage: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    // Mock data for demonstration - in real app, these would come from Redux or API
    const sectorTx = useMemo(() => [
        { id: 'TX-001', date: '2026-01-11', category: 'Utility', description: 'Electricity Bill - Jan', amount: 4500, type: 'EXPENSE' },
        { id: 'TX-002', date: '2026-01-10', category: 'Rent', description: 'Office Rent - Chennai', amount: 45000, type: 'EXPENSE' },
        { id: 'TX-003', date: '2026-01-09', category: 'Marketing', description: 'Facebook Ads - Q1', amount: 12000, type: 'EXPENSE' },
        { id: 'TX-004', date: '2026-01-08', category: 'Stationery', description: 'Printer Toner & Paper', amount: 2500, type: 'EXPENSE' },
        { id: 'TX-005', date: '2026-01-07', category: 'Repairs', description: 'AC Maintenance', amount: 3500, type: 'EXPENSE' },
    ], []);

    const pieData = useMemo(() => {
        const categories: Record<string, number> = {};
        sectorTx.forEach(t => {
            if (t.type === 'EXPENSE') {
                categories[t.category] = (categories[t.category] || 0) + t.amount;
            }
        });
        return Object.entries(categories).map(([name, value]) => ({ name, value }));
    }, [sectorTx]);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight uppercase">
                            <Receipt className="w-6 h-6 text-primary" />
                            Expense Intelligence Hub
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5 font-medium">
                            Monitoring and optimizing operational overhead for <span className="font-bold text-primary">{tenant_id}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95 uppercase tracking-widest">
                            <Download className="w-4 h-4" /> Export
                        </button>
                        <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 uppercase tracking-widest">
                            <TrendingDown className="w-4 h-4" /> Log Expense
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Total Monthly Burn</p>
                        <h3 className="text-3xl font-black italic">₹{(sectorTx.reduce((acc, t) => acc + t.amount, 0) / 1000).toFixed(1)}k</h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <TrendingDown className="w-4 h-4 text-success" />
                            <span className="text-[10px] font-black text-success uppercase">-2.4% vs Last Month</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group hover:border-primary/30 transition">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1 italic">Highest Sector</p>
                        <h3 className="text-xl font-black uppercase text-primary">Rent & Utilities</h3>
                        <p className="text-[10px] text-neutral-500 mt-2 font-bold uppercase">₹49,500 total impact</p>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-5 rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Audit Score</p>
                        <h3 className="text-3xl font-black text-success italic">98%</h3>
                        <p className="text-[10px] text-neutral-500 mt-2 font-bold uppercase italic tracking-tighter">Compliant Spend Detected</p>
                    </div>

                    <div className="bg-neutral-950 text-white p-5 rounded-sm shadow-xl shadow-primary/10 relative overflow-hidden group">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 italic">Agent Strategy</p>
                        <p className="text-xs font-bold leading-relaxed pr-8">Reduce cloud costs by <span className="text-primary italic">switching to yearly</span> billing.</p>
                        <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-primary group-hover:translate-x-1 transition" />
                    </div>
                </div>

                {/* Main Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Search Description, ID or Vendor..."
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-sm outline-none focus:ring-2 focus:ring-primary/20 transition shadow-sm font-medium"
                                />
                            </div>
                            <button className="px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-xs font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm uppercase tracking-widest text-neutral-500">
                                <Filter className="w-4 h-4" /> Filter
                            </button>
                        </div>

                        {/* Expense Ledger Table */}
                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm shadow-black/5">
                            <table className="w-full text-left text-sm tabular-nums">
                                <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 text-neutral-400 font-black uppercase tracking-[0.2em] text-[10px]">
                                    <tr>
                                        <th className="p-6">Date</th>
                                        <th className="p-6">Category</th>
                                        <th className="p-6">Description</th>
                                        <th className="p-6 text-right">Impact</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {sectorTx.map(t => (
                                        <tr key={t.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors group cursor-default">
                                            <td className="p-6">
                                                <div className="font-bold text-neutral-900 dark:text-white uppercase tracking-tighter">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                                <div className="text-[10px] text-neutral-400 font-bold">POS-{t.id}</div>
                                            </td>
                                            <td className="p-6">
                                                <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-900 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    {t.category}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className="font-bold text-neutral-800 dark:text-neutral-200">{t.description}</div>
                                                <div className="text-[10px] text-neutral-400 italic">Pre-approved by Admin</div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="font-black text-lg text-error">- ₹{t.amount.toLocaleString()}</div>
                                                <div className="text-[10px] text-error/60 font-black uppercase tracking-widest italic">deducted</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button className="w-full py-5 bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] hover:text-primary border-t border-neutral-100 dark:border-neutral-800 transition hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                Archival Ledger Entry Access
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Analytics */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] pl-2 mb-4">Spend Topology</h4>

                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 p-8 shadow-sm flex flex-col items-center">
                            <h3 className="font-black text-neutral-900 dark:text-white mb-8 uppercase tracking-widest text-xs">Monthly Distribution</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={85}
                                            paddingAngle={8}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    className="outline-none hover:opacity-80 transition cursor-pointer"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#000000',
                                                border: 'none',
                                                borderRadius: '16px',
                                                padding: '12px 16px',
                                                color: '#ffffff',
                                                fontSize: '12px',
                                                fontWeight: '900',
                                                textTransform: 'uppercase',
                                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                            }}
                                            itemStyle={{ color: '#ffffff' }}
                                            formatter={(value: any) => `₹${Number(value).toLocaleString()}`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full mt-8">
                                {pieData.map((d, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter truncate">{d.name}</span>
                                        <span className="text-[10px] font-black text-neutral-900 dark:text-white ml-auto italic">₹{(d.value / 1000).toFixed(0)}k</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent History / Audit Hub */}
                        <div className="bg-neutral-950 text-white p-8 rounded-[2.5rem] border border-neutral-800 shadow-2xl relative overflow-hidden group">
                            <History className="absolute -top-10 -right-10 w-40 h-40 text-primary opacity-5 group-hover:rotate-12 group-hover:scale-110 transition duration-1000" />
                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[9px] font-black uppercase tracking-[0.2em] mb-6">
                                    <ShieldAlert className="w-3.5 h-3.5 fill-current" /> Financial Core Guard
                                </div>
                                <h4 className="text-xl font-black mb-4 leading-tight italic">Detect Leakage. <span className="text-primary underline">Secure Profit.</span></h4>
                                <div className="space-y-4 mb-8">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-sm hover:bg-white/10 transition">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] font-black text-neutral-500 uppercase">Anomaly Check</span>
                                            <span className="text-[9px] font-black text-success uppercase italic">Normal</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-neutral-400 leading-relaxed italic">No abnormal repetitive vendor payouts detected in last 30 hours.</p>
                                    </div>
                                </div>
                                <button className="w-full py-4 bg-primary text-white rounded-sm font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                    Full Expense Audit Scan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

// Internal icon helpers
const ShieldAlert = (props: React.ComponentProps<'svg'>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
    </svg>
);

export default ExpenseManagerPage;
