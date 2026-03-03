import React, { useEffect, useState } from 'react';
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    AreaChart, Area, LineChart, Line, CartesianGrid
} from 'recharts';
import { TrendingUp, AlertCircle, DollarSign, PieChart } from 'lucide-react';
// import { getSupplierReports } from ..... (Mocking for now as service isn't connected in frontend api yet)
// We will simulate the data fetch for this artifacts demo

const SupplierReports: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API Fetch
        setTimeout(() => {
            setData({
                payables: [
                    { supplierName: 'Alpha Steel', totalOutstanding: 450000 },
                    { supplierName: 'Beta Cement', totalOutstanding: 320000 },
                    { supplierName: 'Gamma Paints', totalOutstanding: 150000 },
                    { supplierName: 'Delta Elec', totalOutstanding: 120000 },
                    { supplierName: 'Epsilon Tools', totalOutstanding: 80000 },
                ],
                trends: [
                    { _id: { month: 1, year: 2024 }, totalAmount: 120000 },
                    { _id: { month: 2, year: 2024 }, totalAmount: 150000 },
                    { _id: { month: 3, year: 2024 }, totalAmount: 180000 },
                    { _id: { month: 4, year: 2024 }, totalAmount: 140000 },
                    { _id: { month: 5, year: 2024 }, totalAmount: 220000 },
                    { _id: { month: 6, year: 2024 }, totalAmount: 250000 },
                ],
                cashFlow: [
                    { _id: 23, amountDue: 50000 }, // Week numbers
                    { _id: 24, amountDue: 75000 },
                    { _id: 25, amountDue: 30000 },
                    { _id: 26, amountDue: 120000 },
                ],
                profitability: [
                    { supplierName: 'Alpha Steel', totalMargin: 50000, marginPercent: 12 },
                    { supplierName: 'Gamma Paints', totalMargin: 45000, marginPercent: 18 },
                ],
                overdue: [
                    { billNo: 'B-101', supplier: { businessName: 'Alpha Steel' }, amount: 25000, dueDate: '2024-05-20' },
                    { billNo: 'B-105', supplier: { businessName: 'Beta Cement' }, amount: 12000, dueDate: '2024-05-22' },
                ]
            });
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) return <Layout>Loading Reports...</Layout>;

    return (
        <Layout>
            <PageHeader
                title="Supplier Analytics & Reports"
                description="Deep dive into financial liability and performance metrics"
                breadcrumbs={[{ label: 'Suppliers' }, { label: 'Reports' }]}
            />

            <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* Top Payables */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-rose-600">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Top 10 Payables</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Who do we owe most?</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.payables} layout="vertical" margin={{ left: 40 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="supplierName"
                                    type="category"
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                                    width={100}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="totalOutstanding" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Purchase Trends */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Purchase Trends</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Spend Analysis</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.trends}>
                                <defs>
                                    <linearGradient id="colorSplit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="_id.month" tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="totalAmount" stroke="#6366f1" fillOpacity={1} fill="url(#colorSplit)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-8">
                {/* Cash Flow Forecast */}
                <div className="lg:col-span-2 bg-slate-900 text-white rounded-[2.5rem] p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10">
                        <DollarSign className="w-64 h-64" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-black mb-1">Cash Requirement Forecast</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Projected Outflows (Next 8 Weeks)</p>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data?.cashFlow}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="_id" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="amountDue" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4, fill: '#22d3ee' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Profit Impact Leaders */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600">
                            <PieChart className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Margin Leaders</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top 5 by Profit</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {data?.profitability?.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.supplierName}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Margin</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-emerald-600">+{item.marginPercent}%</p>
                                    <p className="text-[10px] font-bold text-slate-500">₹{item.totalMargin.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Overdue List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl text-amber-600">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white">Immediate Action Required</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overdue Bills List</p>
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr>
                            <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-wider pl-4">Bill No</th>
                            <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-wider">Supplier</th>
                            <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-wider">Due Date</th>
                            <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-wider pr-4 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="space-y-2">
                        {data?.overdue?.map((bill: any, i: number) => (
                            <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-xl">
                                <td className="py-3 pl-4 text-xs font-bold text-slate-600 dark:text-slate-300 rounded-l-xl">{bill.billNo}</td>
                                <td className="py-3 text-xs font-bold text-slate-800 dark:text-white">{bill.supplier?.businessName}</td>
                                <td className="py-3 text-xs font-bold text-rose-500">{new Date(bill.dueDate).toLocaleDateString()}</td>
                                <td className="py-3 pr-4 text-xs font-black text-slate-800 dark:text-white text-right rounded-r-xl">₹{bill.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Layout>
    );
};

export default SupplierReports;
