import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllCustomers, deleteCustomer, reset } from "../../redux/slices/customerSlice";
import Layout from "../../components/shared/Layout/index";
import Modal from "../../components/shared/Overlay/Modal";
import PageHeader from "../../components/shared/Layout/PageHeader";
import {
    Users,
    UserPlus,
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
import { Button, Card, Input } from '@/components/shared';
import { RootState, AppDispatch } from "../../redux/store";
import { Customer } from './types';
import { getColorClasses } from '../../utils/tailwindColorClasses';

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
        { label: 'Total Portfolio', value: customers.length, icon: Users, color: 'indigo', trend: '+5.2%' },
        { label: 'Pending Collections', value: customersWithDuesCount, icon: CreditCard, color: 'amber', trend: 'Critical' },
        { label: 'Market Exposure', value: `₹${(totalDues / 100000).toFixed(1)}L`, icon: TrendingUp, color: 'rose', trend: 'High' }
    ];

    return (
        <Layout>
            <PageHeader
                title="Customer Portfolio"
                description="Monitor market exposure, collection cycles, and customer relations"
                breadcrumbs={[{ label: 'Dashboard', link: '/' }, { label: 'Customers' }]}
                actions={
                    <>
                        <Button
                            variant="warning"
                            size="md"
                            icon={<CreditCard className="w-4 h-4" />}
                            onClick={() => navigate('/customers/with-dues')}
                        >
                            Collection Report
                        </Button>
                        <Button
                            variant="primary"
                            size="md"
                            icon={<UserPlus className="w-4 h-4" />}
                            onClick={() => navigate('/customers/add')}
                        >
                            Add High-Value Customer
                        </Button>
                    </>
                }
            />

            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, i) => {
                        const colorClasses = getColorClasses(stat.color);
                        return (
                        <Card key={i} variant="default" size="md" className="relative overflow-hidden group hover:shadow-md">
                            <Card.Body>
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                    <stat.icon className={`w-24 h-24 ${colorClasses.text}`} />
                                </div>
                                <div className="relative z-10">
                                    <div className={`w-12 h-12 rounded-sm ${colorClasses.surface} flex items-center justify-center mb-4`}>
                                        <stat.icon className={`w-6 h-6 ${colorClasses.icon}`} />
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                            <p className="text-3xl font-black text-slate-800 dark:text-white mt-1">{stat.value}</p>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${colorClasses.surface} ${colorClasses.text} uppercase tracking-tighter`}>
                                            {stat.trend}
                                        </span>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                        );
                    })}
                </div>

                {/* Main Content Card */}
                <Card variant="default" size="lg">
                    <Card.Body>
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                            <div className="w-full sm:w-96">
                                <Input
                                    type="text"
                                    placeholder="Filter records by name, ID or terminal..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="secondary" size="sm">
                                    <RefreshCcw className="w-4 h-4" />
                                </Button>
                                <Button variant="secondary" size="sm">
                                    <Download className="w-4 h-4" />
                                </Button>
                                <Button variant="secondary" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] uppercase tracking-[0.15em] font-black text-slate-400">
                                    <th className="px-8 py-5">Strategic Partner</th>
                                    <th className="px-8 py-5">Contact</th>
                                    <th className="px-8 py-5">Collection Risk</th>
                                    <th className="px-8 py-5">Operational Status</th>
                                    <th className="px-8 py-5 text-right">Terminal Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 border-4 border-primary/20 border-t-indigo-600 rounded-full animate-spin"></div>
                                                <p className="text-sm font-bold text-slate-400">Synchronizing Global Records...</p>
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
                                    <tr key={customer._id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-sm bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-base shadow-lg shadow-indigo-200 dark:shadow-none group-hover:scale-110 transition-transform">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-800 dark:text-white leading-none mb-1">{customer.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">CID-{customer._id.slice(-6).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                    <Phone className="w-3 h-3" />
                                                    <span className="text-xs font-medium">{customer.phone}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="text-[11px] truncate max-w-[150px]">{customer.email || 'offline-only'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${customer.dues > 0 ? 'bg-warning-soft dark:bg-warning-soft text-warning' : 'bg-success-soft dark:bg-success-soft text-success'}`}>
                                                        ₹{(customer.dues || 0).toLocaleString('en-IN')}
                                                    </span>
                                                    {customer.dues > 0 && <span className="text-[9px] font-black text-danger uppercase tracking-tighter animate-pulse flex items-center gap-1"><ArrowUpRight className="w-2.5 h-2.5" /> High</span>}
                                                </div>
                                                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${customer.dues > 0 ? 'bg-warning' : 'bg-success'}`}
                                                        style={{ width: customer.dues > 50000 ? '100%' : `${(customer.dues / 50000) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-success">
                                                <ShieldCheck className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest tracking-[0.2em]">Verified</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/customers/${customer._id}`)}
                                                    className="p-2.5 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                                    title="Risk Profile"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/customers/edit/${customer._id}`)}
                                                    className="p-2.5 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                                    title="Modify Node"
                                                >
                                                    <TrendingUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(customer._id)}
                                                    className="p-2.5 text-slate-400 hover:text-danger hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
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
                    </Card.Body>
                </Card>
            </div>

            {/* Decommission Confirmation */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Authorization Required"
                size="sm"
            >
                <div className="space-y-6">
                    <div className="flex flex-col items-center text-center gap-4">
                        <div className="w-16 h-16 rounded-sm bg-danger-soft dark:bg-danger-soft flex items-center justify-center">
                            <Trash2 className="w-8 h-8 text-danger" />
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">Remove this customer?</p>
                            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                                Terminating this consumer record will archive all associated marketplace behaviors. Historical transaction integrity will be preserved for auditing.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="secondary"
                            size="md"
                            fullWidth
                            onClick={() => setDeleteConfirm(null)}
                        >
                            Abort
                        </Button>
                        <Button
                            variant="danger"
                            size="md"
                            fullWidth
                            onClick={() => handleDelete(deleteConfirm!)}
                        >
                            Confirm Termination
                        </Button>
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};

export default Customers;

