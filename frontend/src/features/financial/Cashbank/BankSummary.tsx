import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Layout from "../../../components/shared/Layout/index";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import CashBankHero from './components/CashBankHero';
import { getBankSummary } from "../../../redux/slices/cashbankSlice";
import { RootState, AppDispatch } from "../../../redux/store";
import { TypeConfig } from './types';
import {
    Building2,
    Wallet,
    TrendingUp,
    PieChart,
    Landmark,
    AlertTriangle,
    Banknote,
    ChevronRight,
    FileText,
    ArrowRightLeft,
    Settings,
    CheckCircle2,
    BarChart3
} from 'lucide-react';

const BankSummary: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { bankSummary: summary, isLoading: loading } = useSelector((state: RootState) => state.cashbank);

    useEffect(() => {
        dispatch(getBankSummary());
    }, [dispatch]);

    const typeConfig: TypeConfig = {
        'Savings': { icon: Wallet, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600' },
        'Current': { icon: Banknote, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
        'Overdraft': { icon: AlertTriangle, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
        'Loan': { icon: Landmark, color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600' }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex flex-col justify-center items-center h-64 gap-4">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Indexing Financial Data</p>
                </div>
            </Layout>
        );
    }

    const totalBalance = summary?.totalBalance || 0;
    const accountCount = summary?.accountCount || 0;
    const accounts = summary?.accounts || [];

    return (
        <Layout>
            <PageHeader
                title="Financial Intelligence Dashboard"
                description="Comprehensive analytics and portfolio surveillance across all banking instruments"
                breadcrumbs={[{ label: 'Treasury', link: '/cashbank/position' }, { label: 'Intelligence' }]}
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/cashbank/transfers')}
                            className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
                        >
                            <ArrowRightLeft className="w-4 h-4" /> Transfer
                        </button>
                        <button
                            onClick={() => navigate('/cashbank/bank-accounts')}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                            <Settings className="w-4 h-4" /> Manage Units
                        </button>
                    </div>
                }
            />

            <CashBankHero
                title="Aggregate Portfolio Value"
                value={`₹${totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                icon={BarChart3}
                stats={
                    <>
                        <div className="px-4 py-2 bg-white/10 rounded-sm backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {accountCount} Active Institution{accountCount !== 1 ? 's' : ''}
                        </div>
                        <div className="px-4 py-2 bg-white/10 rounded-sm backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-success" />
                            Avg: ₹{accountCount > 0 ? (totalBalance / accountCount).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : 0}
                        </div>
                        <div className="px-4 py-2 bg-success/20 rounded-sm backdrop-blur-md border border-success/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-emerald-300">
                            <CheckCircle2 className="w-4 h-4" />
                            Financial Health: Optimal
                        </div>
                    </>
                }
                extraActions={
                    <>
                        <button onClick={() => navigate('/cashbank/position')} className="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-sm border border-white/20 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between">
                            Treasury Command Center <ChevronRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate('/cashbank/cash-in-hand')} className="px-6 py-4 bg-white/10 hover:bg-white/20 rounded-sm border border-white/20 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between">
                            Vault Surveillance <ChevronRight className="w-4 h-4" />
                        </button>
                    </>
                }
            />

            {/* Account Type Allocation Grid */}
            {accounts.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <PieChart className="w-4 h-4" />
                        Portfolio Allocation by Instrument Type
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {['Savings', 'Current', 'Overdraft', 'Loan'].map((type) => {
                            const config = typeConfig[type] || typeConfig['Savings'];
                            const Icon = config.icon;
                            const typeAccounts = accounts.filter(a => a.accountType === type);
                            const typeBalance = typeAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
                            const percentageValue = totalBalance > 0 ? ((typeBalance / totalBalance) * 100) : 0;
                            const percentage = percentageValue.toFixed(1);

                            return (
                                <div key={type} className={`${config.bg} border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 transition-all hover:shadow-lg hover:scale-[1.02] group`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-sm bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className={`text-2xl font-black ${config.text}`}>{typeAccounts.length}</span>
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{type}</h4>
                                    <p className="text-xs font-bold text-slate-400 mt-1">₹{typeBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Portfolio Share</span>
                                            <span className={`text-xs font-black ${config.text}`}>{percentage}%</span>
                                        </div>
                                        <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full bg-gradient-to-r ${config.color} rounded-full transition-all`} style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Institution Registry */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Landmark className="w-4 h-4" />
                        Institution Registry
                    </h3>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {accounts.length} Unit{accounts.length !== 1 ? 's' : ''} Indexed
                    </span>
                </div>

                {accounts.length === 0 ? (
                    <div className="py-20 bg-slate-50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl flex items-center justify-center text-slate-200 mb-6">
                            <Building2 className="w-10 h-10" />
                        </div>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">No Institutions Registered</h4>
                        <p className="text-xs font-medium text-slate-400 mt-2 mb-6">Initialize your banking portfolio by adding your first institution.</p>
                        <button
                            onClick={() => navigate('/cashbank/bank-accounts')}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-sm text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
                        >
                            Add First Institution
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {accounts.map((account) => {
                            const config = typeConfig[account.accountType] || typeConfig['Savings'];
                            const Icon = config.icon;
                            const isPositive = (account.currentBalance || 0) >= 0;

                            return (
                                <div key={account._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 transition-all hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900 group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-sm flex items-center justify-center text-xl font-black text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform">
                                                {account.bankName?.charAt(0) || 'B'}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{account.bankName}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">****{account.accountNumber?.slice(-4) || '0000'}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${config.bg} ${config.text}`}>
                                            {account.accountType}
                                        </span>
                                    </div>

                                    <div className="flex items-end justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
                                            <p className={`text-xl font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                ₹{(account.currentBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/cashbank/ledger/${account._id}`)}
                                            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-primary rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest transition-all flex items-center gap-1.5"
                                        >
                                            <FileText className="w-3.5 h-3.5" /> Ledger
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default BankSummary;

