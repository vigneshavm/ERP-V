import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import {
    getTransactions,
    getCashBankPosition,
    getAccounts,
    createCashTransaction,
    reset
} from '../../redux/slices/cashbankSlice';
import { toast } from 'react-toastify';
import {
    Plus,
    Minus,
    FileText,
    Calendar,
    IndianRupee,
    LayoutGrid,
    Navigation,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    History,
    X,
    MoreHorizontal,
    Activity,
    Info,
    Zap,
    Briefcase
} from 'lucide-react';

const CashInHand = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [filterType, setFilterType] = useState('all');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    const { transactions, position, accounts, isLoading, isSuccess, isError, message } = useSelector(state => state.cashbank);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        type: 'in',
        otherAccount: '',
        reference: ''
    });

    useEffect(() => {
        dispatch(getTransactions('cash'));
        dispatch(getCashBankPosition());
        dispatch(getAccounts());
    }, [dispatch]);

    useEffect(() => {
        if (isSuccess && showAddTransaction) {
            toast.success('Capital re-indexed successfully!');
            setShowAddTransaction(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                description: '',
                amount: 0,
                type: 'in',
                otherAccount: '',
                reference: ''
            });
            dispatch(getTransactions('cash'));
            dispatch(getCashBankPosition());
            dispatch(getAccounts());
            dispatch(reset());
        }
        if (isError && message) {
            toast.error(message);
            dispatch(reset());
        }
    }, [isSuccess, isError, message, dispatch, showAddTransaction]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(createCashTransaction(formData));
    };

    const filteredTransactions = transactions.filter(t => {
        const matchesType = filterType === 'all' || t.type === filterType;
        const txnDate = t.date.split('T')[0];
        const matchesDate = (!dateRange.from || txnDate >= dateRange.from) && (!dateRange.to || txnDate <= dateRange.to);
        return matchesType && matchesDate;
    });

    const categories = [
        { group: 'Operational Inflow', items: ['Sales', 'Customer Payment', 'Service Fee'] },
        { group: 'Operational Outflow', items: ['Office Rent', 'Electricity', 'Water Bill', 'Internet', 'Stationery', 'Tea/Snacks', 'Other Expense'] },
        { group: 'Institutional Units', items: accounts.map(a => ({ value: a._id, label: `Vault: ${a.bankName}` })) }
    ];

    const FormSection = ({ title, children }) => (
        <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                {title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    );

    const InputWrapper = ({ label, icon: Icon, children }) => (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
            <div className="relative group">
                {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
                {children}
            </div>
        </div>
    );

    return (
        <Layout>
            <PageHeader
                title="Vault Surveillance"
                description="High-fidelity monitoring of physical capital and direct fiscal clearing"
                breadcrumbs={[{ label: 'Treasury', link: '/cashbank/position' }, { label: 'Vault' }]}
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setFormData({ ...formData, type: 'in', otherAccount: '' }); setShowAddTransaction(true); }}
                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 dark:shadow-none hover:bg-emerald-700 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Capital Inflow
                        </button>
                        <button
                            onClick={() => { setFormData({ ...formData, type: 'out', otherAccount: '' }); setShowAddTransaction(true); }}
                            className="px-6 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-100 dark:shadow-none hover:bg-rose-700 transition-all flex items-center gap-2"
                        >
                            <Minus className="w-4 h-4" /> Capital Outflow
                        </button>
                    </div>
                }
            />

            {/* Immersive Liquidity Pulse */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-[3rem] p-12 mb-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform pointer-events-none">
                    <Wallet className="w-64 h-64" />
                </div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                            Live Vault Liquidity
                        </div>
                        <h2 className="text-6xl font-black tracking-tighter">₹{(position?.cashInHand || 0).toLocaleString('en-IN')}</h2>
                        <div className="flex items-center gap-4 mt-8">
                            <div className="px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${position?.cashInHand > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                                Operational Status: {position?.cashInHand > 0 ? 'Healthy' : 'Depleted'}
                            </div>
                            <button onClick={() => navigate('/cashbank/ledger/cash')} className="text-[10px] font-black uppercase tracking-widest text-indigo-200 hover:text-white transition-all underline underline-offset-8">Audit Ledger</button>
                        </div>
                    </div>
                    <div className="hidden lg:grid grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm">
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 text-center">Aggregate Inflow</p>
                            <p className="text-xl font-black text-emerald-400 text-center">₹{transactions.filter(t => t.type === 'in' || (t.type === 'transfer' && t.toAccount === 'cash')).reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm">
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 text-center">Aggregate Outflow</p>
                            <p className="text-xl font-black text-rose-400 text-center">₹{transactions.filter(t => t.type === 'out' || (t.type === 'transfer' && t.fromAccount === 'cash')).reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Terminal Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                    {['all', 'in', 'out'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md scale-105'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            {type === 'all' ? 'All Channels' : type === 'in' ? 'Inflows' : 'Outflows'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-400 focus:outline-none"
                    />
                    <MoreHorizontal className="w-4 h-4 text-slate-300" />
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-400 focus:outline-none"
                    />
                </div>
            </div>

            {/* Execution Terminal */}
            {showAddTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up">
                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Vault Transfer Terminal</h2>
                                <p className="text-xs font-medium text-slate-400">Recording manual {formData.type === 'in' ? 'Inflow' : 'Outflow'} protocol</p>
                            </div>
                            <button type="button" onClick={() => setShowAddTransaction(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-10 space-y-8">
                            <FormSection title="Clearing Matrix">
                                <InputWrapper label="Execution Date" icon={Calendar}>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                        required
                                    />
                                </InputWrapper>
                                <InputWrapper label="Liquidity Volume (₹)" icon={IndianRupee}>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                        placeholder="0.00"
                                        required
                                    />
                                </InputWrapper>
                            </FormSection>

                            <FormSection title="Routing Information">
                                <InputWrapper label="Category / Origin Unit" icon={Navigation}>
                                    <select
                                        value={formData.otherAccount}
                                        onChange={(e) => setFormData({ ...formData, otherAccount: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm bg-no-repeat"
                                        required
                                    >
                                        <option value="">Select Routing Channel</option>
                                        {categories.map(group => (
                                            <optgroup key={group.group} label={group.group.toUpperCase()}>
                                                {group.items.map(item => (
                                                    <option key={typeof item === 'string' ? item : item.value} value={typeof item === 'string' ? item : item.value}>
                                                        {typeof item === 'string' ? item : item.label}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </InputWrapper>
                                <InputWrapper label="Registry Reference" icon={FileText}>
                                    <input
                                        type="text"
                                        value={formData.reference}
                                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                        placeholder="Voucher or Clearing ID"
                                    />
                                </InputWrapper>
                            </FormSection>

                            <div className="md:col-span-2">
                                <InputWrapper label="Transactional Narrative" icon={History}>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm leading-relaxed"
                                        placeholder="Detailed purpose of manual clearing"
                                        required
                                    />
                                </InputWrapper>
                            </div>

                            {/* Impact Advisory */}
                            {formData.amount > 0 && formData.otherAccount && (
                                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-6 rounded-[2rem] flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                                            <Zap className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anticipated Impact</p>
                                            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                                                {formData.type === 'in' ? 'Depositing into Vault' : 'Withdrawing from Vault'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Vault Index</p>
                                        <p className="text-xl font-black text-indigo-600">₹{(formData.type === 'in' ? (position?.cashInHand || 0) + formData.amount : (position?.cashInHand || 0) - formData.amount).toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            <button type="button" onClick={() => setShowAddTransaction(false)} className="px-8 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Abort</button>
                            <button type="submit" disabled={isLoading} className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 text-white ${formData.type === 'in' ? 'bg-emerald-600 shadow-emerald-100 dark:shadow-none hover:bg-emerald-700' : 'bg-rose-600 shadow-rose-100 dark:shadow-none hover:bg-rose-700'}`}>
                                {isLoading ? 'Committing...' : `Commit ${formData.type === 'in' ? 'Inflow' : 'Outflow'}`}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Transaction Ledger Grid */}
            <div className="grid grid-cols-1 gap-4 pb-20">
                {filteredTransactions.map(t => {
                    const isIn = t.type === 'in' || (t.type === 'transfer' && t.toAccount === 'cash');
                    return (
                        <div key={t._id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
                            <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${isIn ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
                                    {isIn ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                                        {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {t.reference || 'NO-REF'}
                                    </p>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{t.description}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 italic">Channel: {t.type === 'transfer' ? 'Internal Transfer' : 'Direct Manual'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-xl font-black ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isIn ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN')}
                                </p>
                                <button className="p-1 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all">Audit Detalle</button>
                            </div>
                        </div>
                    );
                })}

                {filteredTransactions.length === 0 && (
                    <div className="py-20 bg-slate-50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl flex items-center justify-center text-slate-200 mb-6 font-black text-4xl">
                            ?
                        </div>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">No Temporal Ledger Data</h4>
                        <p className="text-xs font-medium text-slate-400 mt-2">Initialize a capital pulse through the inflow/outflow controls above.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CashInHand;
