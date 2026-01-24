import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import {
    TrendingUp,
    PiggyBank,
    Wallet,
    ArrowRightLeft,
    ShieldCheck,
    Zap,
    Download,
    RefreshCw,
    PieChart,
    ChevronRight,
    ArrowUpRight,
    ArrowDownLeft,
    Activity
} from 'lucide-react';

const CashBankPosition = () => {
    const navigate = useNavigate();
    const [position, setPosition] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosition();
    }, []);

    const fetchPosition = async () => {
        try {
            setLoading(true);
            const userData = JSON.parse(localStorage.getItem('user'));
            const token = userData?.token;
            const response = await api.get(
                `/api/cashbank/position`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPosition(response.data);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load cash/bank position');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !position) {
        return (
            <Layout>
                <div className="flex justify-center items-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Synchronizing Treasury Nodes...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const QuickAction = ({ title, icon: Icon, onClick, color }) => (
        <button
            onClick={onClick}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 group transition-all"
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${color}`}>
                    <Icon className="w-5 h-5 shadow-sm" />
                </div>
                <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-tight group-hover:text-indigo-500">{title}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-all" />
        </button>
    );

    return (
        <Layout>
            <PageHeader
                title="Treasury Command Center"
                description="Real-time surveillance of global liquidity and capital allocation"
                breadcrumbs={[{ label: 'Treasury', link: '/cashbank/position' }, { label: 'Liquidity Center' }]}
                actions={
                    <button
                        onClick={fetchPosition}
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                }
            />

            <div className="grid grid-cols-12 gap-6">
                {/* Liquidity Pulse Banners */}
                <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 dark:shadow-none space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform">
                            <Wallet className="w-40 h-40" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Physical Vault Node</p>
                            <h2 className="text-4xl font-black mt-2">₹{(position?.cashInHand || 0).toLocaleString('en-IN')}</h2>
                            <p className="text-xs font-bold opacity-80 mt-1 flex items-center gap-1.5"><ArrowDownLeft className="w-3 h-3 text-emerald-400" /> Cash-in-hand liquidity</p>
                        </div>
                        <button onClick={() => navigate('/cashbank/cash-in-hand')} className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-xl backdrop-blur-md text-[10px] font-black uppercase tracking-widest transition-all">Enter Vault</button>
                    </div>

                    <div className="bg-gradient-to-br from-slate-800 to-slate-950 p-8 rounded-[2.5rem] text-white shadow-xl space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform">
                            <PiggyBank className="w-40 h-40" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Digital Treasury Node</p>
                            <h2 className="text-4xl font-black mt-2">₹{(position?.totalBankBalance || 0).toLocaleString('en-IN')}</h2>
                            <p className="text-xs font-bold opacity-80 mt-1 flex items-center gap-1.5"><ArrowUpRight className="w-3 h-3 text-blue-400" /> Across {position?.breakdown.bank.accounts} active units</p>
                        </div>
                        <button onClick={() => navigate('/cashbank/bank-accounts')} className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-xl backdrop-blur-md text-[10px] font-black uppercase tracking-widest transition-all">Monitor Banks</button>
                    </div>
                </div>

                {/* Aggregate Exposure Sidebar */}
                <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <TrendingUp className="w-32 h-32" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                                    <PieChart className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Net Liquidity</h3>
                            </div>
                            <h2 className="text-5xl font-black text-slate-800 dark:text-white">₹{(position?.totalLiquidity || 0).toLocaleString('en-IN')}</h2>
                            <p className="text-xs font-bold text-slate-400 mt-2 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
                                Operational Threshold: Healthy
                            </p>
                        </div>
                        <div className="mt-8 space-y-4">
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>Capital Allocation</span>
                                <span>100% Volume</span>
                            </div>
                            <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                <div className="bg-indigo-500 shadow-lg shadow-indigo-200/50" style={{ width: `${position?.breakdown.cash.percentage}%` }}></div>
                                <div className="bg-slate-800 dark:bg-slate-700" style={{ width: `${position?.breakdown.bank.percentage}%` }}></div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{position?.breakdown.cash.percentage}% Cash</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-slate-800 dark:bg-slate-400"></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{position?.breakdown.bank.percentage}% Bank</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clearing House Hotkeys */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600">
                                <ArrowRightLeft className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Internal Clearing</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            <QuickAction
                                title="Withdrawal Execution"
                                icon={ArrowDownLeft}
                                color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                                onClick={() => navigate('/cashbank/transfers', { state: { toAccount: 'cash' } })}
                            />
                            <QuickAction
                                title="Deposit Execution"
                                icon={ArrowUpRight}
                                color="bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                                onClick={() => navigate('/cashbank/transfers', { state: { fromAccount: 'cash' } })}
                            />
                            <QuickAction
                                title="Unit Management"
                                icon={ShieldCheck}
                                color="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20"
                                onClick={() => navigate('/cashbank/bank-accounts')}
                            />
                        </div>
                    </div>

                    {/* Fiscal Advisory */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/5 border border-amber-100 dark:border-amber-800/30 p-8 rounded-[2.5rem] space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600">
                                <Zap className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-black text-amber-900 dark:text-amber-300 uppercase tracking-widest leading-none">Fiscal Advisory</h4>
                        </div>
                        <div className="space-y-3">
                            {position?.breakdown.cash.percentage > 30 && (
                                <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium leading-relaxed italic">High vault exposure detected. Consider re-routing capital to digital units for standard risk mitigation.</p>
                            )}
                            {position?.breakdown.bank.percentage > 95 && (
                                <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium leading-relaxed italic">Minimum liquidity reached in physical nodes. Maintain operational reserve for immediate market clearance.</p>
                            )}
                            <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium leading-relaxed italic">Current asset distribution matches optimized ERP liquidity patterns for the region.</p>
                        </div>
                    </div>
                </div>

                {/* Capital Performance Grid */}
                <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm space-y-6 group overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                                    <Wallet className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Vault Density</h3>
                            </div>
                            <span className="text-2xl font-black text-emerald-600">{position?.breakdown.cash.percentage}%</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                                <span>Unit Reserves</span>
                                <span>₹{(position?.cashInHand || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000 origin-left"
                                    style={{ width: `${position?.breakdown.cash.percentage}%` }}
                                ></div>
                            </div>
                            <p className="text-xs font-medium text-slate-500 leading-relaxed">Aggregated physical capital ready for standard immediate market deployment and petty clearance.</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm space-y-6 group overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                    <PiggyBank className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Bank Exposure</h3>
                            </div>
                            <span className="text-2xl font-black text-blue-600">{position?.breakdown.bank.percentage}%</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                                <span>Aggregated Units</span>
                                <span>₹{(position?.totalBankBalance || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full rounded-full transition-all duration-1000 origin-left shadow-lg shadow-blue-500/20"
                                    style={{ width: `${position?.breakdown.bank.percentage}%` }}
                                ></div>
                            </div>
                            <p className="text-xs font-medium text-slate-500 leading-relaxed">Secured digital assets distributed across recognized institutional treasury units and liquidity clearing accounts.</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CashBankPosition;
