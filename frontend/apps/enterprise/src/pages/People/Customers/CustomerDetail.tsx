import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomerById, getCustomerTransactions, reset } from "@/entities/contact/model/customerSlice";
import { Layout, PageHeader } from "@/shared/ui";
import {
    Phone,
    Mail,
    MapPin,
    TrendingUp,
    ShieldCheck,
    History,
    Calendar,
    ArrowUpRight,
    UserCheck,
    Zap,
    Download
} from 'lucide-react';
import { RootState, AppDispatch } from "@/app/store/store";
import { DetailCard, DataPoint } from './components/CustomerUI';

const CustomerDetail = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { id } = useParams<{ id: string }>();
    const { customer, transactions, isLoading, isError, message } = useSelector(
        (state: RootState) => state.customers
    );

    useEffect(() => {
        if (id) {
            dispatch(getCustomerById(id));
            dispatch(getCustomerTransactions(id));
        }
        return () => {
            dispatch(reset());
        };
    }, [dispatch, id]);

    if (isLoading && !customer) {
        return (
            <Layout>
                <div className="page-shell">
                <div className="flex justify-center items-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-muted">Authenticating Partner Profile...</p>
                    </div>
                </div>
                      </div>

            </Layout>
        );
    }

    if (!customer) {
        return (
            <Layout>
                <div className="p-20 text-center flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-3xl bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] flex items-center justify-center grayscale opacity-50">
                        <UserCheck className="w-10 h-10 text-muted" />
                    </div>
                    <p className="text-lg font-black text-main uppercase tracking-widest">Entry Restricted</p>
                    <p className="text-sm text-muted max-w-xs">{message || 'This consumer profile has been archived or does not exist in the current terminal.'}</p>
                    <button onClick={() => navigate('/customers')} className="mt-4 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all font-medium">Return to Portfolio</button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageHeader
                title={customer.name}
                description={`Monitoring strategic relations for ${customer.name} (Global ID: CID-${(customer._id || customer.id || '').slice(-6).toUpperCase()})`}
                breadcrumbs={[{ label: 'Portfolio', link: '/customers' }, { label: 'Partner Intel' }]}
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/customers/edit/${customer._id}`)}
                            className="flex items-center gap-2 px-6 py-2 border border-default dark:border-default text-secondary dark:text-muted rounded-xl text-sm font-bold hover:bg-[var(--erp-bg-sunken)] transition-all font-medium"
                        >
                            Modify Profile
                        </button>
                        <button
                            onClick={() => navigate(`/customers/adjust-due/${customer._id}`)}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all font-medium"
                        >
                            Adjust Ledger
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-12 gap-6">
                {/* Financial Pulse Sidebar */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-100 dark:shadow-none space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform">
                            <Zap className="w-40 h-40" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Portfolio exposure</p>
                            <h2 className="text-5xl font-black mt-2">₹{(customer.dues || 0).toLocaleString('en-IN')}</h2>
                            <p className="text-xs font-bold opacity-80 mt-1 flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Net outstanding balance</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                                <p className="text-[9px] font-black uppercase opacity-60">Risk Index</p>
                                <p className="text-sm font-black mt-1">{customer.dues > 100000 ? 'High' : 'Low'}</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                                <p className="text-[9px] font-black uppercase opacity-60">Credit Limit</p>
                                <p className="text-sm font-black mt-1">₹5.0L</p>
                            </div>
                        </div>
                    </div>

                    {/* Predictive Intelligence Gauge */}
                    <div className="bg-white dark:bg-[var(--erp-bg)] rounded-[2.5rem] border border-default dark:border-default p-8 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-muted uppercase tracking-widest">Buying Intent</h3>
                            <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-[10px] font-black rounded-lg">High Growth</span>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90">
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-main" />
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 * (1 - 0.82)} strokeLinecap="round" className="text-indigo-600" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-black text-main">82%</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <p className="text-sm font-bold text-secondary dark:text-slate-200">Probability</p>
                                <p className="text-xs text-muted leading-relaxed">System predicts a high-value purchase within 12 days based on browsing & frequency.</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50 dark:border-default">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-muted uppercase">Churn Risk Level</span>
                                <span className="text-[10px] font-black text-emerald-500 uppercase">Minimal (4%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '4%' }} />
                            </div>
                        </div>
                    </div>

                    <DetailCard title="Partner Intel" icon={UserCheck}>
                        <div className="space-y-6">
                            <DataPoint label="Primary Contact" value={customer.name} subLabel="Decision Maker" />
                            <DataPoint label="Tele-Registry" value={customer.phone} subLabel="Verified direct line" />
                            <DataPoint label="Email Node" value={customer.email || ''} subLabel="Official communication" />
                            <DataPoint label="Market Origin" value={typeof customer.referrer === 'string' ? customer.referrer : (customer.referrer as any)?.name} subLabel="Source of introduction" />
                        </div>
                    </DetailCard>
                </div>

                {/* Logistics & Reachability */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <DetailCard title="Reachability Node" icon={MapPin}>
                            <div className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 p-6 rounded-[2rem] border border-default dark:border-default/50 group-hover:border-indigo-500/30 transition-all">
                                <p className="text-xs font-black text-muted uppercase tracking-widest mb-3">Facility Address</p>
                                <p className="text-sm font-bold text-secondary dark:text-muted leading-relaxed italic">"{customer.address || 'Operational address not registered in global database.'}"</p>
                            </div>
                        </DetailCard>
                        <DetailCard title="Operational Status" icon={ShieldCheck}>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                                    <div className="flex items-center gap-3 text-emerald-600">
                                        <ShieldCheck className="w-5 h-5" />
                                        <span className="text-xs font-black uppercase tracking-widest">Active Partner</span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] rounded-2xl border border-default dark:border-default">
                                    <div className="flex items-center gap-3 text-muted">
                                        <Calendar className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Joined {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </DetailCard>
                    </div>

                    {/* Behavior Analytics / History */}
                    <div className="bg-white dark:bg-[var(--erp-bg)] rounded-[3rem] border border-default dark:border-default shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-default dark:border-default flex justify-between items-center bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-card)]/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600">
                                    <History className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-main uppercase tracking-tight">Market Behavior</h3>
                            </div>
                            <button className="p-3 text-muted hover:text-indigo-600 hover:bg-white dark:hover:bg-[var(--erp-card)] rounded-xl transition-all shadow-sm border border-transparent hover:border-default dark:hover:border-default">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            {transactions && transactions.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-card)]/30 text-[9px] uppercase tracking-[0.15em] font-black text-muted">
                                            <th className="px-8 py-4">Execution Date</th>
                                            <th className="px-8 py-4">Event Type</th>
                                            <th className="px-8 py-4">Market Value</th>
                                            <th className="px-8 py-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {transactions.map((tx: any, index: number) => (
                                            <tr key={tx._id || index} className="hover:bg-[var(--erp-bg-sunken)]/30 dark:hover:bg-[var(--erp-card)]/30 transition-all">
                                                <td className="px-8 py-5">
                                                    <p className="text-xs font-bold text-secondary dark:text-muted">
                                                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-5 text-[10px] font-black uppercase text-muted tracking-tighter">
                                                    {tx.type || 'Standard Capture'}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-xs font-black text-main">₹{(tx.amount || 0).toLocaleString('en-IN')}</p>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[9px] font-black uppercase rounded-lg">Success</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-20 text-center opacity-30">
                                    <Zap className="w-12 h-12 mx-auto text-muted mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">No Historical Oscillations Recorded</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default CustomerDetail;

