import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllCustomers, deleteCustomer, reset } from "@/entities/contact/model/customerSlice";
import { Layout, PageHeader, Modal } from "@/shared/ui";
import {
    Users,
    UserPlus,
    Search,
    MoreVertical,
    Eye,
    Trash2,
    Download,
    RefreshCcw,
    TrendingUp,
    ShieldCheck,
    CreditCard,
    Phone,
    Mail,
    ArrowUpRight
} from 'lucide-react';
import { RootState, AppDispatch } from "@/app/store/store";
import { Customer } from './types';

const Customers = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { customers, isLoading } = useSelector(
        (state: RootState) => state.customers
    );

    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        dispatch(getAllCustomers());
        return () => {
            if (window.location.pathname === "/customers")
                dispatch(reset());
        };
    }, [dispatch]);

    const handleDelete = async (id: string) => {
        await dispatch(deleteCustomer(id));
        setDeleteConfirm(null);
        dispatch(getAllCustomers());
    };

    const filteredCustomers = (customers as Customer[]).filter(
        (customer) =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm) ||
            (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const customersWithDuesCount = (customers as Customer[]).filter(c => c.dues > 0).length;
    const totalDues = (customers as Customer[]).reduce((sum, c) => sum + (c.dues || 0), 0);

    const stats = [
        { label: 'Strategic Portfolio', value: customers.length, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', trend: '+5.2% Volume' },
        { label: 'Collection Risk', value: customersWithDuesCount, icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', trend: 'Critical Surveillance' },
        { label: 'Market Exposure', value: `₹${(totalDues / 100000).toFixed(1)}L`, icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', trend: 'High Velocity' }
    ];

    return (
        <Layout>
            <PageHeader
                title="Customer Portfolio"
                description="Monitor market exposure, collection cycles, and partner relations"
                breadcrumbs={[{ label: 'Dashboard', link: '/' }, { label: 'Customers' }]}
                actions={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/customers/with-dues')}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-white/10 transition-all font-mono italic"
                        >
                            <CreditCard className="w-4 h-4 text-amber-400" /> Collection Audit
                        </button>
                        <button
                            onClick={() => navigate('/customers/add')}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 transition-all"
                        >
                            <UserPlus className="w-4 h-4" /> Provision Partner
                        </button>
                    </div>
                }
            />

            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, i) => (
                        <div key={i} className="premium-card p-6 sm:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group border border-white/5">
                            <div className="absolute top-0 right-0 p-8 sm:p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                                <stat.icon className={`w-28 h-28 ${stat.color}`} />
                            </div>
                            <div className="relative z-10">
                                <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.border} flex items-center justify-center mb-6 shadow-lg`}>
                                    <stat.icon className={`w-7 h-7 ${stat.color}`} />
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] italic">{stat.label}</p>
                                        <p className="text-3xl sm:text-4xl font-black text-slate-100 mt-1 font-mono italic">{stat.value}</p>
                                    </div>
                                    <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl ${stat.bg} ${stat.color} uppercase tracking-widest border ${stat.border} italic font-mono`}>
                                        {stat.trend}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Card */}
                <div className="premium-card rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5">
                    <div className="p-6 sm:p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 bg-white/5 backdrop-blur-xl">
                        <div className="relative w-full sm:w-[500px] group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search strategic partners by name, CID, or communication node..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all font-black text-xs text-slate-200 placeholder:text-slate-600 tracking-wide"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="p-3.5 text-slate-500 hover:text-indigo-400 bg-white/5 border border-white/10 rounded-2xl transition-all shadow-lg hover:bg-white/10">
                                <RefreshCcw className="w-4 h-4" />
                            </button>
                            <button className="p-3.5 text-slate-500 hover:text-indigo-400 bg-white/5 border border-white/10 rounded-2xl transition-all shadow-lg hover:bg-white/10">
                                <Download className="w-4 h-4" />
                            </button>
                            <button className="p-3.5 text-slate-500 hover:text-indigo-400 bg-white/5 border border-white/10 rounded-2xl transition-all shadow-lg hover:bg-white/10">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 backdrop-blur-md text-[10px] uppercase tracking-[0.25em] font-black text-slate-500">
                                    <th className="px-8 py-6">Strategic Partner</th>
                                    <th className="px-8 py-6">Communication Node</th>
                                    <th className="px-8 py-6">Risk Quotient</th>
                                    <th className="px-8 py-6">Operational Status</th>
                                    <th className="px-8 py-6 text-right">Terminal Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-lg shadow-indigo-500/20"></div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse italic">Synchronizing Global Records...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-50 grayscale">
                                                <Users className="w-16 h-16 text-slate-300" />
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-relaxed">No Consumer Patterns Detected<br /><span className="text-[10px] font-normal lowercase italic text-slate-400">Modify your search parameters for broader analysis</span></p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCustomers.map((customer) => (
                                    <tr key={customer._id} className="group hover:bg-white/5 transition-all duration-300 border-b border-white/5 last:border-0 cursor-default">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 flex items-center justify-center text-indigo-400 font-black text-lg shadow-xl group-hover:scale-110 transition-all duration-500 group-hover:border-indigo-500/30 font-mono italic">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-200 leading-none mb-1.5 uppercase tracking-wide group-hover:text-indigo-400 transition-colors">{customer.name}</p>
                                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] font-mono italic">CID-{customer._id.slice(-8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3 text-slate-400">
                                                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                                                    <span className="text-[11px] font-black font-mono tracking-tight">{customer.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-slate-600">
                                                    <Mail className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-bold italic tracking-wide lowercase">{customer.email || 'offline-only'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center justify-between gap-6">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest font-mono italic ${customer.dues > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                                        ₹{(customer.dues || 0).toLocaleString('en-IN')}
                                                    </span>
                                                    {customer.dues > 0 && <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.2em] animate-pulse flex items-center gap-1.5 italic"><ArrowUpRight className="w-3 h-3" /> Critical</span>}
                                                </div>
                                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${customer.dues > 0 ? 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-lg shadow-rose-500/50' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/50'}`}
                                                        style={{ width: customer.dues > 100000 ? '100%' : `${Math.max(5, (customer.dues / 100000) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2.5 text-emerald-400">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50"></div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono italic">Verified Node</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => navigate(`/customers/${customer._id}`)}
                                                    className="p-3 text-slate-500 hover:text-indigo-400 bg-white/5 border border-white/10 rounded-2xl transition-all shadow-lg hover:bg-white/10 hover:border-indigo-500/30"
                                                    title="Risk Profile"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/customers/edit/${customer._id}`)}
                                                    className="p-3 text-slate-500 hover:text-blue-400 bg-white/5 border border-white/10 rounded-2xl transition-all shadow-lg hover:bg-white/10 hover:border-blue-500/30"
                                                    title="Modify Node"
                                                >
                                                    <TrendingUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(customer._id)}
                                                    className="p-3 text-slate-500 hover:text-rose-400 bg-white/5 border border-white/10 rounded-2xl transition-all shadow-lg hover:bg-white/10 hover:border-rose-500/30"
                                                    title="Termination"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Decommission Confirmation */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Authorization Required"
                size="sm"
            >
                <div className="space-y-8 py-4">
                    <div className="flex flex-col items-center text-center gap-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-2xl shadow-rose-500/10">
                            <Trash2 className="w-10 h-10 text-rose-500" />
                        </div>
                        <div className="space-y-3">
                            <p className="text-xl font-black text-slate-200 leading-tight uppercase tracking-tight italic">Terminate Partner Link?</p>
                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed tracking-wide">
                                Terminating this consumer record will archive all associated marketplace behaviors. Historical transaction integrity will be preserved for auditing in the fiscal ledger.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setDeleteConfirm(null)}
                            className="flex-1 px-6 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-white/10 transition-all shadow-xl font-mono italic"
                        >
                            Abort Process
                        </button>
                        <button
                            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                            className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-rose-500 shadow-2xl shadow-rose-600/20 transition-all font-mono italic"
                        >
                            Execute Termination
                        </button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};

export default Customers;

