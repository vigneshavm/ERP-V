import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getCustomerById, getCustomerTransactions, reset } from "@/entities/contact/model/customerSlice";
import Layout from "@/shared/ui/Layout/Layout";
import PageShell from "@/shared/ui/Layout/PageShell";
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
    Download,
    ArrowLeft,
    Edit,
    CreditCard,
    CheckCircle,
    User
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
                <PageShell className="flex flex-col items-center justify-center py-40">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <User className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500 animate-pulse" />
                    </div>
                    <p className="mt-6 text-sm font-black uppercase tracking-widest text-neutral-400 animate-pulse">Decrypting Partner DNA...</p>
                </PageShell>
            </Layout>
        );
    }

    if (!customer) {
        return (
            <Layout>
                <PageShell className="max-w-4xl mx-auto py-20 flex flex-col items-center text-center">
                    <div className="erp-card rounded-[2.5rem] p-12 border-rose-500/20 bg-rose-500/[0.02] flex flex-col items-center">
                        <div className="p-6 bg-rose-500/10 rounded-2xl text-rose-500 mb-6">
                            <UserCheck className="w-12 h-12" />
                        </div>
                        <h2 className="text-2xl font-black text-neutral-900 dark:text-main uppercase tracking-tight mb-3">Identity Restricted</h2>
                        <p className="text-neutral-500 font-medium mb-8 max-w-sm italic">
                            {message || 'This consumer profile has been neutralized or archived in the global ledger.'}
                        </p>
                        <button 
                            onClick={() => navigate('/customers')} 
                            className="px-10 py-4 bg-neutral-900 dark:bg-neutral-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-3"
                        >
                            <ArrowLeft className="w-4 h-4" /> Return to Summary
                        </button>
                    </div>
                </PageShell>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageShell className="bg-app flex-1 flex flex-col min-h-0 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Immersive Header */}
                <div className="erp-card rounded-[3rem] p-10 bg-neutral-900 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000">
                        <User className="w-64 h-64" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-6">
                                <button
                                    onClick={() => navigate('/customers')}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <span className="w-1 h-1 rounded-full bg-white/30" />
                                <div className="flex items-center gap-2 px-3 py-1 bg-indigo-500/20 backdrop-blur-md rounded-lg border border-indigo-500/20">
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Verified Partner</span>
                                </div>
                            </div>
                            
                            <h1 className="text-5xl font-black tracking-tighter mb-4 flex items-baseline gap-4">
                                {customer.name}
                                <span className="text-lg font-bold text-white/50 tracking-normal italic font-serif">Profile 360 Intel</span>
                            </h1>
                            
                            <p className="text-sm font-medium text-white/50 italic tracking-wide">
                                Global ID: <span className="text-indigo-400 font-black font-mono">CID-{(customer._id || customer.id || '').slice(-6).toUpperCase()}</span> • Monitoring strategic relations since {new Date(customer.createdAt || '').getFullYear()}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-end gap-3 self-end lg:self-center">
                            <button
                                onClick={() => navigate(`/customers/edit/${customer._id}`)}
                                className="px-6 py-4 bg-white/10 border border-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" /> Modify Profile
                            </button>
                            <button
                                onClick={() => navigate(`/customers/adjust-due/${customer._id}`)}
                                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <CreditCard className="w-4 h-4" /> Adjust Ledger
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8 mb-20">
                    {/* Financial Pulse Sidebar */}
                    <div className="col-span-12 lg:col-span-4 space-y-8">
                        {/* Liquidity Exposure */}
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                                <Zap className="w-40 h-40" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 italic">Portfolio Exposure</p>
                                    <h2 className="text-5xl font-black mt-4 font-mono italic tracking-tighter italic">₹{(customer.dues || 0).toLocaleString('en-IN')}</h2>
                                    <p className="text-xs font-bold opacity-80 mt-2 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Net outstanding balance</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-xl border border-white/10">
                                        <p className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-none mb-1.5">Risk Index</p>
                                        <p className="text-sm font-black uppercase tracking-tight">{customer.dues > 100000 ? 'Level: Critical' : 'Level: Nominal'}</p>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-xl border border-white/10">
                                        <p className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-none mb-1.5">Credit Ceiling</p>
                                        <p className="text-sm font-black uppercase tracking-tight font-mono">₹5.00L</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Intelligence Analytics Gauge */}
                        <div className="erp-card rounded-[2.5rem] p-8 space-y-8 shadow-sm border-none relative overflow-hidden group">
                             <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex items-center justify-between relative z-10">
                                <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest italic">Acquisition Intent</h3>
                                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-lg uppercase tracking-widest border border-emerald-500/10">
                                    High Growth
                                </div>
                            </div>

                            <div className="flex items-center gap-8 relative z-10">
                                <div className="relative w-28 h-28 flex items-center justify-center group/gauge">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-neutral-100 dark:text-neutral-900" />
                                        <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={301.6} strokeDashoffset={301.6 * (1 - 0.82)} strokeLinecap="round" className="text-indigo-600 transition-all duration-1000 ease-out" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-black text-neutral-900 dark:text-white font-mono italic">82%</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-xs font-black text-neutral-900 dark:text-neutral-200 uppercase tracking-tight italic">Velocity Prediction</p>
                                    <p className="text-[10px] text-neutral-500 font-medium leading-relaxed italic border-l-2 border-indigo-500/20 pl-3">
                                        System-wide neural analytics predict high-value acquisition sequence within 12 fiscal cycles.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-default dark:border-neutral-800 relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Disengagement Risk Flux</span>
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">Nominal (4%)</span>
                                </div>
                                <div className="w-full h-2 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-full overflow-hidden border border-default dark:border-neutral-900">
                                    <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000" style={{ width: '4%' }} />
                                </div>
                            </div>
                        </div>

                        {/* Technical Profile Breakdown */}
                        <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none group">
                            <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-8 flex items-center gap-2 italic">
                                <UserCheck className="w-4 h-4 text-indigo-500/50" /> Technical identity Node
                            </h3>
                            <div className="space-y-6">
                                <DataPoint label="Primary Identification" value={customer.name} subLabel="Decision Authority" />
                                <DataPoint label="Telematic Hub" value={customer.phone} subLabel="Verified communication path" />
                                <DataPoint label="Protocol Node" value={customer.email || 'NULL'} subLabel="Official digital signature" />
                                <DataPoint label="Referrer Stream" value={typeof customer.referrer === 'string' ? customer.referrer : (customer.referrer as any)?.name || 'Organic'} subLabel="Introduction vector" />
                            </div>
                        </div>
                    </div>

                    {/* Operational Details & Behavior Center */}
                    <div className="col-span-12 lg:col-span-8 space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Reachability matrix */}
                            <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity">
                                    <MapPin className="w-32 h-32" />
                                </div>
                                <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-6 flex items-center gap-2 italic">
                                    <MapPin className="w-4 h-4 text-indigo-500/50" /> Reachability matrix
                                </h3>
                                <div className="bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 p-6 rounded-[2rem] border border-default dark:border-neutral-800 group-hover:border-indigo-500/30 transition-all min-h-[120px] flex flex-col justify-center">
                                    <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-3 italic leading-none">Registered Facility Address</p>
                                    <p className="text-sm font-black text-neutral-900 dark:text-neutral-200 leading-relaxed italic uppercase tracking-tight">
                                        "{customer.address || 'Operational reachability matrix not established in profile.'}"
                                    </p>
                                </div>
                            </div>

                            {/* State Verification */}
                            <div className="erp-card rounded-[2.5rem] p-8 shadow-sm border-none group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity">
                                    <ShieldCheck className="w-32 h-32" />
                                </div>
                                <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-6 flex items-center gap-2 italic">
                                    <ShieldCheck className="w-4 h-4 text-indigo-500/50" /> State Verification
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-[1.5rem] border border-emerald-500/10 group/status">
                                        <div className="flex items-center gap-4 text-emerald-500">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center animate-pulse">
                                                <CheckCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <span className="text-sm font-black uppercase tracking-widest leading-none">Active High-Trust</span>
                                                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">Status Nominal</p>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-5 h-5 text-emerald-400 transform transition-transform group-hover/status:translate-x-1 group-hover/status:-translate-y-1" />
                                    </div>
                                    <div className="flex items-center justify-between p-6 bg-[var(--erp-bg-sunken)] dark:bg-neutral-950/50 rounded-[1.5rem] border border-default dark:border-neutral-800">
                                        <div className="flex items-center gap-4 text-neutral-500">
                                            <Calendar className="w-5 h-5 text-indigo-500/50" />
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Sector Entry</span>
                                                <p className="text-xs font-black text-neutral-900 dark:text-neutral-200 mt-1">
                                                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Unknown Cycle'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Historical Behavioral oscillations */}
                        <div className="erp-card rounded-[3.5rem] p-10 shadow-sm border-none overflow-hidden relative group">
                            <div className="flex justify-between items-center mb-10 px-2">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform duration-700">
                                        <History className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-neutral-900 dark:text-main uppercase tracking-tighter italic leading-none">Behavioral Oscillations</h3>
                                </div>
                                <button className="p-4 bg-white dark:bg-neutral-950 border border-default dark:border-neutral-800 rounded-2xl text-neutral-500 hover:text-indigo-500 hover:border-indigo-500/20 transition-all shadow-xl group/btn">
                                    <Download className="w-5 h-5 group-hover/btn:animate-bounce" />
                                </button>
                            </div>

                            <div className="overflow-x-auto px-1">
                                {transactions && transactions.length > 0 ? (
                                    <table className="w-full text-left border-separate border-spacing-y-4">
                                        <thead>
                                            <tr className="text-[10px] font-black font-black uppercase tracking-[0.3em] text-neutral-400">
                                                <th className="px-8 py-2">Temporal Index</th>
                                                <th className="px-8 py-2">Oscillation Type</th>
                                                <th className="px-8 py-2">Liquidity Delta</th>
                                                <th className="px-8 py-2 text-right">State Node</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((tx: any, index: number) => (
                                                <tr key={tx._id || index} className="group/row hover:transform hover:-translate-y-1 transition-all duration-500">
                                                    <td className="px-2 py-1">
                                                        <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 group-hover/row:border-indigo-500/20 group-hover/row:shadow-xl transition-all font-mono font-black text-neutral-500 uppercase tracking-tight text-xs">
                                                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all text-[10px] font-black uppercase text-neutral-900 dark:text-neutral-100 tracking-widest italic leading-none">
                                                            {tx.type || 'Standard Capture'}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1">
                                                        <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-6 border border-default dark:border-neutral-800 transition-all text-xl font-black text-neutral-900 dark:text-neutral-100 font-mono tracking-tighter italic text-right">
                                                            ₹{(tx.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-1 text-right">
                                                        <div className="flex justify-end pr-6">
                                                            <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase rounded-xl border border-emerald-500/10 tracking-widest italic">
                                                                Synchronized
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="py-24 text-center border-2 border-dashed border-default dark:border-neutral-800 rounded-[3rem] group/empty">
                                        <Zap className="w-16 h-16 mx-auto text-neutral-200 dark:text-neutral-800 mb-6 group-hover/empty:scale-110 transition-transform duration-700" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400 italic">No Historical Oscillations Identified</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branded Profile Verification */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 group pb-20">
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em]">Partner DNA Immutable Artifact</span>
                    </div>
                    <div className="h-px w-20 bg-neutral-400 dark:bg-neutral-600" />
                </div>
            </PageShell>
        </Layout>
    );
};

export default CustomerDetail;
