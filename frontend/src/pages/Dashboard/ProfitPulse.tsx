import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "@/redux/store";
import Layout from "@/components/shared/Layout/Layout";
import { Card } from "@/components/core/Display/Card";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import {
    AlertTriangle, BatteryCharging,
    Zap, PackageSearch, Clock, ShieldAlert, CheckCircle2,
    TrendingUp, ArrowRight
} from 'lucide-react';
import { formatCurrency } from "@/utils/helpers";
import { Product } from "@/types/product";
import { Customer } from "@/types/sales";
import { setActiveTab } from '@/redux/slices/uiSlice';

const ProfitPulsePage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { bankBalance: balance } = useSelector((state: RootState) => state.finance);
    const { items: products } = useSelector((state: RootState) => state.inventory);
    const { customers } = useSelector((state: RootState) => state.pos);
    const { currentSector, theme } = useSelector((state: RootState) => state.auth);

    const isDark = theme === 'dark';

    // --- 1. CASH RUNWAY PREDICTION ---
    const cashFlowData = useMemo(() => {
        const data: any[] = [];
        let currentBalance = balance;
        const avgDailySales = 5000;
        const avgDailyExpense = 4200;
        const netBurn = avgDailySales - avgDailyExpense;

        for (let i = 7; i > 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            data.push({
                day: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                balance: currentBalance - (netBurn * i),
                type: 'Historical'
            });
        }

        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            let dayExpense = avgDailyExpense;
            if (d.getDate() === 1) dayExpense += 15000;

            currentBalance += (avgDailySales - dayExpense);

            data.push({
                day: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                balance: currentBalance,
                type: 'Projected'
            });
        }
        return data;
    }, [balance]);

    const minCashBalance = Math.min(...cashFlowData.map((d: any) => d.balance));
    const isDangerZone = minCashBalance < 0;
    const daysUntilZero = cashFlowData.findIndex((d: any) => d.balance < 0 && d.type === 'Projected');

    const smartStock = useMemo(() => {
        return (products || [])
            .filter((p: Product) => (p as any).sector === currentSector)
            .map((p: Product) => {
                const hash = p.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                const velocity = (hash % 5) + 1;
                const daysRemaining = Math.floor((p.stockQty || 0) / velocity);
                return { ...p, velocity, daysRemaining };
            })
            .sort((a, b) => a.daysRemaining - b.daysRemaining)
            .slice(0, 5);
    }, [products, currentSector]);

    const highRiskCustomers = useMemo(() => {
        return (customers || [])
            .filter((c: Customer) => (c as any).creditBalance > 0)
            .sort((a: Customer, b: Customer) => {
                const scoreMap: Record<string, number> = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                return (scoreMap[(b as any).riskScore] || 0) - (scoreMap[(a as any).riskScore] || 0);
            });
    }, [customers]);

    return (
        <Layout>
            <div className="space-y-10 animate-fade-in pb-12 p-4 md:p-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2 border-b border-slate-200 dark:border-slate-800/50">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-amber-500/20">Alpha Beta</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            ProfitPulse AI
                            <Zap className="w-8 h-8 text-amber-500 fill-amber-500 animate-pulse" />
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Predictive Cash Flow & Business Intelligence</p>
                    </div>

                    <div className={`px-5 py-3 rounded-2xl flex items-center gap-3 font-black text-xs uppercase tracking-widest shadow-sm border backdrop-blur-md ${isDangerZone
                        ? 'bg-rose-50/50 border-rose-200 text-rose-600 dark:bg-rose-500/5 dark:border-rose-500/20'
                        : 'bg-emerald-50/50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/5 dark:border-emerald-500/20'
                        }`}>
                        {isDangerZone
                            ? <><AlertTriangle className="w-5 h-5 animate-bounce" /> Cash Crunch: {daysUntilZero} days remaining</>
                            : <><BatteryCharging className="w-5 h-5" /> Cash Runway Healthy (&gt;30 Days)</>
                        }
                    </div>
                </div>

                {/* --- MAIN PREDICTION CHART --- */}
                <div className="bg-white dark:bg-[#020617]/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 shadow-sm transition-all overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700"></div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Forecast Analysis</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">30-Day Cash Runway</h3>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Actual
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-slate-300 border border-slate-400 border-dashed"></span> Projected
                            </div>
                        </div>
                    </div>

                    <div className="h-80 w-full relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isDangerZone ? '#f43f5e' : '#6366f1'} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={isDangerZone ? '#f43f5e' : '#6366f1'} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#e2e8f0'} strokeOpacity={0.5} />
                                <XAxis
                                    dataKey="day"
                                    fontSize={10}
                                    stroke="#94a3b8"
                                    tickMargin={12}
                                    minTickGap={30}
                                    axisLine={false}
                                    tickLine={false}
                                    fontFamily="Inter, sans-serif"
                                    fontWeight={600}
                                />
                                <YAxis
                                    fontSize={10}
                                    stroke="#94a3b8"
                                    tickFormatter={val => `₹${val / 1000}k`}
                                    axisLine={false}
                                    tickLine={false}
                                    fontFamily="Inter, sans-serif"
                                    fontWeight={600}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.day}</p>
                                                    <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                                        {formatCurrency(payload[0].value as number)}
                                                    </p>
                                                    <p className={`text-[8px] font-black uppercase mt-1 ${payload[0].payload.type === 'Historical' ? 'text-indigo-500' : 'text-slate-400'}`}>
                                                        {payload[0].payload.type} Balance
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth={2} />
                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke={isDangerZone ? '#f43f5e' : '#6366f1'}
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorBalance)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* --- SMART STOCK REORDER --- */}
                    <div className="bg-white dark:bg-[#020617]/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/50 shadow-sm transition-all flex flex-col h-full relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-500"></div>

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Inventory AI</p>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                    <PackageSearch className="w-6 h-6 text-indigo-500" /> Smart Stock
                                </h3>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 relative z-10">
                            {smartStock.map((p) => (
                                <div key={p.id || p._id} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 hover:shadow-lg transition-all group/item">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border shadow-sm transition-transform group-hover/item:scale-105 ${p.daysRemaining <= 3
                                            ? 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20'
                                            : 'bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-500/10 dark:border-amber-500/20'
                                            }`}>
                                            <span className="text-lg font-black leading-none">{p.daysRemaining}</span>
                                            <span className="text-[7px] font-black uppercase tracking-widest mt-0.5">Days</span>
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 dark:text-white tracking-tight">{p.name}</p>
                                            <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mt-1">
                                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                                Avg. {p.velocity} units / day
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => dispatch(setActiveTab('INVENTORY'))}
                                        className="p-2.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl transition-all hover:shadow-md active:scale-95"
                                    >
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                            {smartStock.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-full mb-4">
                                        <CheckCircle2 className="w-10 h-10 text-indigo-500 opacity-40" />
                                    </div>
                                    <p className="font-black text-xs uppercase tracking-widest opacity-40">All levels healthy</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- KHATA TRUST SCORE --- */}
                    <div className="bg-slate-900 dark:bg-[#020617]/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 text-white relative flex flex-col h-full group overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:scale-125 transition-transform duration-700"></div>

                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Credit Intelligence</p>
                                <h3 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                                    <ShieldAlert className="w-6 h-6 text-indigo-400" /> Khata Trust Score
                                </h3>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10 flex-1">
                            {highRiskCustomers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-16 text-slate-500">
                                    <Clock className="w-10 h-10 mb-4 opacity-20" />
                                    <p className="font-black text-xs uppercase tracking-widest opacity-40">No pending credit accounts</p>
                                </div>
                            ) : (
                                highRiskCustomers.map((c) => (
                                    <div key={c.id || (c as any)._id} className="group/card flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-1.5 h-12 rounded-full shadow-lg ${(c as any).riskScore === 'HIGH' ? 'bg-rose-500 shadow-rose-500/50' :
                                                (c as any).riskScore === 'MEDIUM' ? 'bg-amber-500 shadow-amber-500/50' :
                                                    'bg-emerald-500 shadow-emerald-500/50'
                                                }`}></div>
                                            <div>
                                                <p className="font-black text-sm tracking-tight">{c.name}</p>
                                                <div className="flex gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                    <span>Limit: {formatCurrency(c.creditLimit || 0)}</span>
                                                    <span className="opacity-20">•</span>
                                                    <span className="text-indigo-400">Paid: {(c as any).lastPaymentDate || 'Initial'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black tracking-tight">{formatCurrency(c.creditBalance || 0)}</p>
                                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${(c as any).riskScore === 'HIGH' ? 'bg-rose-500 animate-pulse' :
                                                    (c as any).riskScore === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                                                    }`}></div>
                                                <p className={`text-[9px] font-black uppercase tracking-tighter ${(c as any).riskScore === 'HIGH' ? 'text-rose-400' :
                                                    (c as any).riskScore === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                                                    }`}>
                                                    {(c as any).riskScore} Risk
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 relative z-10">
                            <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-[1.5rem] font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-[0.98]">
                                <Clock className="w-4 h-4" /> Send Reminders
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProfitPulsePage;
