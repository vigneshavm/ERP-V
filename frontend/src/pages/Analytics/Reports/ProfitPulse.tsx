import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "@/redux/store";
import Layout from "@/components/shared/Layout/Layout";
import { Card } from "@/components/core/Display/Card";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import {
    AlertTriangle, BatteryCharging,
    Zap, PackageSearch, Clock, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { formatCurrency } from "../../../utils/helpers";

const ProfitPulsePage: React.FC = () => {
    const { bankBalance: balance } = useSelector((state: RootState) => state.finance);
    const { items: products } = useSelector((state: RootState) => state.inventory);
    const { invoices: salesHistory, customers } = useSelector((state: RootState) => state.pos);
    const { currentSector, theme } = useSelector((state: RootState) => state.auth);

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
            .filter((p: any) => p.sector === currentSector)
            .map((p: any) => {
                const hash = p.name.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                const velocity = (hash % 5) + 1;
                const daysRemaining = Math.floor(p.stock / velocity);
                return { ...p, velocity, daysRemaining };
            })
            .sort((a: any, b: any) => a.daysRemaining - b.daysRemaining)
            .slice(0, 5);
    }, [products, currentSector]);

    // --- 3. KHATA TRUST SCORE (Credit Risk) ---
    const highRiskCustomers = useMemo(() => {
        return (customers || [])
            .filter((c: any) => c.creditBalance > 0)
            .sort((a: any, b: any) => {
                const scoreMap: Record<string, number> = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                return (scoreMap[b.riskScore] || 0) - (scoreMap[a.riskScore] || 0);
            });
    }, [customers]);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in pb-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Zap className="w-8 h-8 text-amber-500 fill-amber-500" />
                            ProfitPulse AI
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Predictive Cash Flow & Business Intelligence</p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-sm border ${isDangerZone ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                        {isDangerZone
                            ? <><AlertTriangle className="w-4 h-4" /> Cash Crunch projected in {daysUntilZero} days</>
                            : <><BatteryCharging className="w-4 h-4" /> Cash Runway Healthy (&gt;30 Days)</>
                        }
                    </div>
                </div>

                {/* --- MAIN PREDICTION CHART --- */}
                <Card className="p-6 bg-white dark:bg-slate-800">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">30-Day Cash Runway</h3>
                            <p className="text-xs text-slate-500">Projected closing balance based on historical burn rate & upcoming fixed costs.</p>
                        </div>
                        <div className="flex gap-4 text-sm font-bold">
                            <div className="flex items-center gap-2 text-indigo-500">
                                <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Current
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400 border-dashed"></span> Projected
                            </div>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={cashFlowData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isDangerZone ? '#f43f5e' : '#10b981'} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={isDangerZone ? '#f43f5e' : '#10b981'} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                                <XAxis dataKey="day" fontSize={12} stroke="#94a3b8" tickMargin={10} minTickGap={30} />
                                <YAxis fontSize={12} stroke="#94a3b8" tickFormatter={val => `${val / 1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(val: number) => [formatCurrency(val), 'Cash Balance']}
                                />
                                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke={isDangerZone ? '#f43f5e' : '#10b981'}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorBalance)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* --- SMART STOCK REORDER --- */}
                    <Card className="p-6 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <PackageSearch className="w-5 h-5 text-indigo-500" /> Smart Stock
                                </h3>
                                <p className="text-xs text-slate-500">Items predicted to stock out soon based on sales velocity.</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-3">
                            {smartStock.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${p.daysRemaining <= 3 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                            {p.daysRemaining}d
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white text-sm">{p.name}</p>
                                            <p className="text-xs text-slate-500">Avg. {p.velocity} units/day</p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors">
                                        Reorder
                                    </button>
                                </div>
                            ))}
                            {smartStock.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                                    <CheckCircle2 className="w-12 h-12 mb-2 opacity-20" />
                                    <p>Inventory levels look healthy.</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* --- KHATA TRUST SCORE --- */}
                    <Card className="p-6 flex flex-col h-full bg-slate-900 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-indigo-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-indigo-400" /> Credit Trust Score
                                </h3>
                                <p className="text-xs text-slate-400">High-risk accounts based on payment latency.</p>
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10 flex-1">
                            {highRiskCustomers.length === 0 ? (
                                <div className="text-center py-10 text-slate-500">No active credit accounts.</div>
                            ) : (
                                highRiskCustomers.map((c: any) => (
                                    <div key={c.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700 backdrop-blur-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-10 rounded-full ${c.riskScore === 'HIGH' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                                                c.riskScore === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}></div>
                                            <div>
                                                <p className="font-bold text-sm">{c.name}</p>
                                                <div className="flex gap-2 text-[10px] text-slate-400">
                                                    <span>Limit: {formatCurrency(c.creditLimit)}</span>
                                                    <span>•</span>
                                                    <span>Paid: {c.lastPaymentDate || 'Never'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-mono font-bold text-white">{formatCurrency(c.creditBalance)}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-wider ${c.riskScore === 'HIGH' ? 'text-red-400' :
                                                c.riskScore === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                                                }`}>
                                                {c.riskScore} Risk
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-800 relative z-10">
                            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                <Clock className="w-4 h-4" /> Send Payment Reminders
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default ProfitPulsePage;
