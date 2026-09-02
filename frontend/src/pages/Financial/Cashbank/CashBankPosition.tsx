import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import CashBankHero from './components/CashBankHero';
import { getCashBankPosition } from "../../../redux/slices/cashbankSlice";
import { RootState, AppDispatch } from "../../../redux/store";
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

// Moved to module scope - was defined inside CashBankPosition's render body (recreated, and lost
// its DOM state, on every render). Takes everything via props already, so no closure to thread through.
const QuickAction: React.FC<{ title: string; icon: React.ElementType; onClick: () => void; color: string }> = ({ title, icon: Icon, onClick, color }) => (
    <button
        onClick={onClick}
        className="flex items-center justify-between p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[2rem] hover:border-primary group transition-all duration-300 shadow-sm"
    >
        <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-sm flex items-center justify-center transition-all duration-300 ${color} shadow-sm group-hover:scale-110`}>
                <Icon className="w-6 h-6" />
            </div>
            <span className="text-xs font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest group-hover:text-primary transition-colors">{title}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:translate-x-2 transition-all" />
    </button>
);

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
                <div className="flex justify-center items-center py-40">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] animate-pulse">Synchronizing Treasury Nodes...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="Treasury Command"
                    description="Real-time surveillance of global liquidity and capital allocation nodes."
                    breadcrumbs={[
                        { label: 'Home', link: '/dashboard' },
                        { label: 'Treasury', link: '/cashbank/position' },
                        { label: 'Liquidity Center' }
                    ]}
                    actions={
                        <button
                            onClick={fetchPosition}
                            className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 uppercase tracking-widest"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Sync Nodes
                        </button>
                    }
                />

                <div className="grid grid-cols-12 gap-8">
                    {/* Liquidity Pulse Banners */}
                    <div className="col-span-12 lg:col-span-8 space-y-8">
                        <CashBankHero
                            title="Net Aggregate Liquidity"
                            value={`₹${(position?.totalLiquidity || 0).toLocaleString('en-IN')}`}
                            icon={TrendingUp}
                            subtitle="Consolidated real-time market capital across all institutional nodes."
                            stats={
                                <div className="px-5 py-2.5 bg-white/10 rounded-sm backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                    <Activity className="w-4 h-4 text-success animate-pulse" />
                                    Operational Threshold: Healthy
                                </div>
                            }
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-gradient-to-br from-primary to-indigo-700 p-10 rounded-[3rem] text-white shadow-2xl shadow-primary/20 space-y-10 relative overflow-hidden group border border-white/10">
                                <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-1000">
                                    <Wallet className="w-56 h-56" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Physical Vault Node</p>
                                    <h2 className="text-5xl font-black mt-3 tracking-tighter tabular-nums">₹{(position?.cashInHand || 0).toLocaleString('en-IN')}</h2>
                                    <p className="text-xs font-bold text-white/80 mt-4 flex items-center gap-2 italic">
                                        <ArrowDownLeft className="w-4 h-4 text-success" /> Immediate physical liquidity
                                    </p>
                                </div>
                                <button 
                                    onClick={() => navigate('/cashbank/cash-in-hand')} 
                                    className="relative z-10 bg-white/10 hover:bg-white/20 px-8 py-3.5 rounded-sm backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/20 active:scale-95"
                                >
                                    Enter Vault Terminal
                                </button>
                            </div>

                            <div className="bg-neutral-900 dark:bg-neutral-900 p-10 rounded-[3rem] text-white shadow-2xl space-y-10 relative overflow-hidden group border border-neutral-800">
                                <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-1000">
                                    <PiggyBank className="w-56 h-56" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Digital Treasury Node</p>
                                    <h2 className="text-5xl font-black mt-3 tracking-tighter tabular-nums">₹{(position?.totalBankBalance || 0).toLocaleString('en-IN')}</h2>
                                    <p className="text-xs font-bold text-neutral-400 mt-4 flex items-center gap-2 italic">
                                        <ArrowUpRight className="w-4 h-4 text-primary" /> Mapping {position?.breakdown.bank.accounts} active accounts
                                    </p>
                                </div>
                                <button 
                                    onClick={() => navigate('/cashbank/bank-accounts')} 
                                    className="relative z-10 bg-white/5 hover:bg-white/10 px-8 py-3.5 rounded-sm backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-white/5 active:scale-95"
                                >
                                    Monitor Account Nodes
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Aggregate Exposure Sidebar */}
                    <div className="col-span-12 lg:col-span-4 space-y-8">
                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-10 rounded-[3rem] shadow-sm relative overflow-hidden group">
                            <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                <PieChart className="w-48 h-48" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                        <PieChart className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Capital Allocation</h3>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                                            <span>Allocation Metric</span>
                                            <span>100% Total Volume</span>
                                        </div>
                                        <div className="flex h-4 w-full rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                            <div className="bg-primary shadow-lg shadow-primary/40 transition-all duration-1000" style={{ width: `${position?.breakdown.cash.percentage}%` }}></div>
                                            <div className="bg-neutral-800 dark:bg-neutral-400 transition-all duration-1000" style={{ width: `${position?.breakdown.bank.percentage}%` }}></div>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-3 h-3 rounded-full bg-primary" />
                                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{position?.breakdown.cash.percentage || 0}% Vault</span>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-3 h-3 rounded-full bg-neutral-800 dark:bg-neutral-400" />
                                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{position?.breakdown.bank.percentage || 0}% Bank</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Internal Clearing Execution */}
                        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-10 rounded-[3rem] shadow-sm space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-sm bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-primary shadow-sm">
                                    <ArrowRightLeft className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-black text-neutral-900 dark:text-white uppercase tracking-tighter">Node Management</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <QuickAction
                                    title="Withdrawal Execution"
                                    icon={ArrowDownLeft}
                                    color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                                    onClick={() => navigate('/cashbank/transfers', { state: { toAccount: 'cash' } })}
                                />
                                <QuickAction
                                    title="Deposit Execution"
                                    icon={ArrowUpRight}
                                    color="bg-primary/10 text-primary dark:bg-primary/20"
                                    onClick={() => navigate('/cashbank/transfers', { state: { fromAccount: 'cash' } })}
                                />
                                <QuickAction
                                    title="Registry Control"
                                    icon={ShieldCheck}
                                    color="bg-indigo-50 text-primary dark:bg-indigo-900/20"
                                    onClick={() => navigate('/cashbank/bank-accounts')}
                                />
                            </div>
                        </div>

                        {/* Fiscal Advisory Stream */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/5 border border-amber-100 dark:border-amber-900/20 p-10 rounded-[3rem] space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-neutral-900 rounded-sm text-warning shadow-sm border border-amber-100 dark:border-amber-900/20">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-black text-amber-900 dark:text-amber-300 uppercase tracking-[0.2em] leading-none">Fiscal Advisory</h4>
                            </div>
                            <div className="space-y-4">
                                {(position?.breakdown.cash.percentage || 0) > 30 && (
                                    <p className="text-[11px] text-amber-800 dark:text-warning font-bold leading-relaxed italic opacity-80 border-l-2 border-warning/30 pl-4">
                                        High vault exposure detected. Consider re-routing capital to digital units for institutional risk mitigation.
                                    </p>
                                )}
                                {(position?.breakdown.bank.percentage || 0) > 95 && (
                                    <p className="text-[11px] text-amber-800 dark:text-warning font-bold leading-relaxed italic opacity-80 border-l-2 border-warning/30 pl-4">
                                        Minimum liquidity reached in physical nodes. Maintain operational reserve for immediate market clearance.
                                    </p>
                                )}
                                <p className="text-[11px] text-emerald-700 dark:text-success font-bold leading-relaxed italic opacity-80 border-l-2 border-success/30 pl-4">
                                    Asset distribution aligns with optimized ERP liquidity patterns for the current fiscal cycle.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CashBankPosition;
