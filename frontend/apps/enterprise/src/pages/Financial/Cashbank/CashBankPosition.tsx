import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Layout from "@/shared/ui/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
import CashBankHero from './components/CashBankHero';
import { getCashBankPosition } from "@/entities/finance/model/cashbankSlice";
import { RootState, AppDispatch } from "@/app/store/store";
import {
    TrendingUp,
    PiggyBank,
    Wallet,
    ArrowRightLeft,
    ShieldCheck,
    Zap,
    RefreshCw,
    PieChart,
    ChevronRight,
    ArrowUpRight,
    ArrowDownLeft,
    Activity
} from 'lucide-react';

const CashBankPosition: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { position, isLoading: loading } = useSelector((state: RootState) => state.cashbank);

    useEffect(() => {
        dispatch(getCashBankPosition());
    }, [dispatch]);

    const fetchPosition = () => {
        dispatch(getCashBankPosition());
    };

    if (loading && !position) {
        return (
            <Layout>
                <div className="flex justify-center items-center py-32 premium-bg min-h-screen">
                    <div className="flex flex-col items-center gap-6">
                        <div className="erp-spinner w-16 h-16"></div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em] animate-pulse">Synchronizing Treasury Nodes...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const QuickAction: React.FC<{ title: string; icon: React.ElementType; onClick: () => void; color: string }> = ({ title, icon: Icon, onClick, color }) => (
        <button
            onClick={onClick}
            className="flex items-center justify-between p-4 bg-[var(--erp-bg-sunken)] border border-default rounded-2xl hover:border-indigo-500/50 hover:bg-white/10 group transition-all shadow-sm"
        >
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg ${color}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-muted uppercase tracking-widest group-hover:text-main transition-colors">{title}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-secondary group-hover:translate-x-1 group-hover:text-indigo-400 transition-all" />
        </button>
    );

    return (
        <Layout>
            <div className="page-shell">
                <PageHeader
                    title="Treasury Command Center"
                    description="Real-time surveillance of global liquidity and capital allocation"
                    breadcrumbs={[{ label: 'Treasury', link: '/cashbank/position' }, { label: 'Liquidity Center' }]}
                    actions={
                        <button
                            onClick={fetchPosition}
                            className="p-2.5 text-muted hover:text-indigo-400 bg-[var(--erp-bg-sunken)] border border-default rounded-xl transition-all shadow-lg hover:bg-white/10"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    }
                />

                <div className="grid grid-cols-12 gap-6 mt-6">
                    {/* Liquidity Pulse Banners */}
                    <div className="col-span-12 lg:col-span-8">
                        <CashBankHero
                            title="Net Liquidity Position"
                            value={`₹${(position?.totalLiquidity || 0).toLocaleString('en-IN')}`}
                            icon={TrendingUp}
                            subtitle="Consolidated real-time market capital"
                            stats={
                                <>
                                    <div className="px-4 py-2 bg-emerald-500/10 rounded-2xl backdrop-blur-md border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-emerald-400 shadow-lg shadow-emerald-500/5">
                                        <Activity className="w-4 h-4 animate-pulse" />
                                        Operational Threshold: Healthy
                                    </div>
                                </>
                            }
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="erp-card p-6 sm:p-8 rounded-[2.5rem] text-slate-200 shadow-2xl space-y-6 sm:space-y-8 relative overflow-hidden group border border-default bg-gradient-to-br from-indigo-500/10 to-violet-500/5 items-start">
                                <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-[0.03] group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                                    <Wallet className="w-32 h-32 sm:w-40 sm:h-40" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 italic">Physical Vault Node</p>
                                    <h2 className="text-3xl sm:text-4xl font-black mt-2 font-mono italic">₹{(position?.cashInHand || 0).toLocaleString('en-IN')}</h2>
                                    <p className="text-[10px] font-bold text-muted mt-2 uppercase tracking-widest flex items-center gap-1.5"><ArrowDownLeft className="w-3 h-3 text-emerald-400" /> Cash-in-hand liquidity</p>
                                </div>
                                <button onClick={() => navigate('/cashbank/cash-in-hand')} className="bg-[var(--erp-bg-sunken)] hover:bg-white/10 border border-default px-6 py-3 rounded-xl backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl text-muted">Enter Vault</button>
                            </div>

                            <div className="erp-card p-6 sm:p-8 rounded-[2.5rem] text-slate-200 shadow-2xl space-y-6 sm:space-y-8 relative overflow-hidden group border border-default bg-gradient-to-br from-slate-800/20 to-slate-950/20 items-start">
                                <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-[0.03] group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                                    <PiggyBank className="w-32 h-32 sm:w-40 sm:h-40" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted italic">Digital Treasury Node</p>
                                    <h2 className="text-3xl sm:text-4xl font-black mt-2 font-mono italic text-slate-100">₹{(position?.totalBankBalance || 0).toLocaleString('en-IN')}</h2>
                                    <p className="text-[10px] font-bold text-muted mt-2 uppercase tracking-widest flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 text-indigo-400" /> Across {position?.breakdown.bank.accounts} active units</p>
                                </div>
                                <button onClick={() => navigate('/cashbank/bank-accounts')} className="bg-[var(--erp-bg-sunken)] hover:bg-white/10 border border-default px-6 py-3 rounded-xl backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl text-muted">Monitor Banks</button>
                            </div>
                        </div>
                    </div>

                    {/* Aggregate Exposure Sidebar */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="erp-card p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-default">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                                <PieChart className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-lg">
                                        <PieChart className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-200 uppercase tracking-widest italic">Allocation Map</h3>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                                            <span>Capital Distribution</span>
                                            <span className="text-indigo-400 font-mono italic">100% Volume</span>
                                        </div>
                                        <div className="flex h-3 w-full rounded-full overflow-hidden bg-[var(--erp-bg-sunken)] border border-default shadow-inner">
                                            <div className="bg-indigo-500 shadow-lg shadow-indigo-500/50 transition-all duration-1000" style={{ width: `${position?.breakdown.cash.percentage}%` }}></div>
                                            <div className="bg-slate-700/50 transition-all duration-1000" style={{ width: `${position?.breakdown.bank.percentage}%` }}></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                                <span className="text-[10px] font-black text-muted uppercase tracking-tight">{position?.breakdown.cash.percentage || 0}% Cash</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                                <span className="text-[10px] font-black text-muted uppercase tracking-tight">{position?.breakdown.bank.percentage || 0}% Bank</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Clearing House Hotkeys */}
                        <div className="erp-card p-6 sm:p-8 rounded-[2.5rem] shadow-2xl space-y-8 border border-default">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20 shadow-lg">
                                    <ArrowRightLeft className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-slate-200 uppercase tracking-widest italic">Internal Clearing</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <QuickAction
                                    title="Withdrawal Execution"
                                    icon={ArrowDownLeft}
                                    color="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/5"
                                    onClick={() => navigate('/cashbank/transfers', { state: { toAccount: 'cash' } })}
                                />
                                <QuickAction
                                    title="Deposit Execution"
                                    icon={ArrowUpRight}
                                    color="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-indigo-500/5"
                                    onClick={() => navigate('/cashbank/transfers', { state: { fromAccount: 'cash' } })}
                                />
                                <QuickAction
                                    title="Unit Management"
                                    icon={ShieldCheck}
                                    color="bg-slate-500/10 text-muted border border-slate-500/20 shadow-slate-500/5"
                                    onClick={() => navigate('/cashbank/bank-accounts')}
                                />
                            </div>
                        </div>

                        {/* Fiscal Advisory */}
                        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 p-6 sm:p-8 rounded-[2.5rem] space-y-4 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-125 transition-transform duration-700">
                                <Zap className="w-24 h-24 text-amber-500" />
                            </div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400 shadow-lg shadow-amber-500/10">
                                    <Zap className="w-5 h-5 fill-current" />
                                </div>
                                <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest leading-none italic">Fiscal Advisory</h4>
                            </div>
                            <div className="space-y-4 relative z-10">
                                {(position?.breakdown.cash.percentage || 0) > 30 && (
                                    <p className="text-[11px] text-muted font-bold leading-relaxed italic border-l-2 border-amber-500/30 pl-3">High vault exposure detected. Consider re-routing capital to digital units for standard risk mitigation.</p>
                                )}
                                {(position?.breakdown.bank.percentage || 0) > 95 && (
                                    <p className="text-[11px] text-muted font-bold leading-relaxed italic border-l-2 border-amber-500/30 pl-3">Minimum liquidity reached in physical nodes. Maintain operational reserve for immediate market clearance.</p>
                                )}
                                <p className="text-[11px] text-muted font-bold leading-relaxed italic border-l-2 border-default/50 pl-3">Current asset distribution matches optimized ERP liquidity patterns for the region.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="pb-20"></div>
            </div>
        </Layout>
    );
};

export default CashBankPosition;

