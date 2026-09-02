import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomerById, getCustomerTransactions, reset } from "../../../redux/slices/customerSlice";
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import {
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
import { RootState, AppDispatch } from "../../../redux/store";
import { DetailCard, DataPoint } from './components/CustomerUI';

const CustomerDetail = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { id } = useParams<{ id: string }>();
    const { customer, transactions, isLoading, message } = useSelector(
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
                <div className="flex justify-center items-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-slate-400">Authenticating Partner Profile...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!customer) {
        return (
            <Layout>
                <div className="p-20 text-center flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-sm bg-slate-50 dark:bg-slate-800 flex items-center justify-center grayscale opacity-50">
                        <UserCheck className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-widest">Entry Restricted</p>
                    <p className="text-sm text-slate-500 max-w-xs">{message || 'This consumer profile has been archived or does not exist in the current terminal.'}</p>
                    <button onClick={() => navigate('/customers')} className="mt-4 px-8 py-3 bg-indigo-600 text-white rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all font-medium">Return to Portfolio</button>
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
                            className="flex items-center gap-2 px-6 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all font-medium"
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
                            <div className="bg-white/10 p-4 rounded-sm backdrop-blur-md">
                                <p className="text-[9px] font-black uppercase opacity-60">Risk Index</p>
                                <p className="text-sm font-black mt-1">{customer.dues > 100000 ? 'High' : 'Low'}</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-sm backdrop-blur-md">
                                <p className="text-[9px] font-black uppercase opacity-60">Credit Limit</p>
                                <p className="text-sm font-black mt-1">₹5.0L</p>
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
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800/50 group-hover:border-primary/30 transition-all">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Facility Address</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">"{customer.address || 'Operational address not registered in global database.'}"</p>
                            </div>
                        </DetailCard>
                        <DetailCard title="Operational Status" icon={ShieldCheck}>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-sm border border-emerald-100 dark:border-emerald-800/30">
                                    <div className="flex items-center gap-3 text-emerald-600">
                                        <ShieldCheck className="w-5 h-5" />
                                        <span className="text-xs font-black uppercase tracking-widest">Active Partner</span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-success" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-sm border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <Calendar className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Joined {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </DetailCard>
                    </div>

                    {/* Behavior Analytics / History */}
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600">
                                    <History className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Market Behavior</h3>
                            </div>
                            <button className="p-3 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            {transactions && transactions.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-[9px] uppercase tracking-[0.15em] font-black text-slate-400">
                                            <th className="px-8 py-4">Execution Date</th>
                                            <th className="px-8 py-4">Event Type</th>
                                            <th className="px-8 py-4">Market Value</th>
                                            <th className="px-8 py-4 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {transactions.map((tx: any, index: number) => (
                                            <tr key={tx._id || index} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all">
                                                <td className="px-8 py-5">
                                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                    </p>
                                                </td>
                                                <td className="px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                                                    {tx.type || 'Standard Capture'}
                                                </td>
                                                <td className="px-8 py-5">
                                                    <p className="text-xs font-black text-slate-800 dark:text-white">₹{(tx.amount || 0).toLocaleString('en-IN')}</p>
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
                                    <Zap className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Historical Oscillations Recorded</p>
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

