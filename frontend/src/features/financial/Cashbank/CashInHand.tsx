import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from "../../../components/shared/Layout/index";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import CashBankInput from './components/CashBankInput';
import CashBankFormSection from './components/CashBankFormSection';
import CashBankHero from './components/CashBankHero';
import {
    getTransactions,
    getCashBankPosition,
    getAccounts,
    createCashTransaction,
    reset
} from "../../../redux/slices/cashbankSlice";
import { RootState, AppDispatch } from "../../../redux/store";
import { Transaction } from './types';
import { toast } from 'react-toastify';
import {
    Plus,
    Minus,
    FileText,
    Calendar,
    IndianRupee,
    Navigation,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    History,
    Zap
} from 'lucide-react';
import { Button, Input, Modal } from '@/components/shared';

// A blank entry dated today (a function so "today" is when the form is opened or reset).
const emptyCashEntry = (): Partial<Transaction> => ({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: 'in',
    toAccount: '',
    fromAccount: '',
    reference: ''
});

const CashInHand: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    const { transactions, position, accounts, isLoading, isError, message } = useSelector((state: RootState) => state.cashbank);

    const [formData, setFormData] = useState<Partial<Transaction>>(emptyCashEntry);

    useEffect(() => {
        dispatch(getTransactions('cash'));
        dispatch(getCashBankPosition());
        dispatch(getAccounts());
    }, [dispatch]);

    useEffect(() => {
        if (isError && message) {
            toast.error(message);
            dispatch(reset());
        }
    }, [isError, message, dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dispatch(createCashTransaction(formData)).unwrap();
        } catch {
            return; // Rejected: the isError effect above reports it; keep the form open.
        }
        toast.success('Capital re-indexed successfully!');
        setShowAddTransaction(false);
        setFormData(emptyCashEntry());
        dispatch(getTransactions('cash'));
        dispatch(getCashBankPosition());
        dispatch(reset());
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

    return (
        <Layout>
            <div className="pt-8 space-y-8 pb-20">
                <PageHeader
                title="Vault Surveillance"
                description="High-fidelity monitoring of physical capital and direct fiscal clearing"
                breadcrumbs={[{ label: 'Treasury', link: '/cashbank/position' }, { label: 'Vault' }]}
                actions={
                    <div className="flex gap-2">
                        <Button
                            variant="success"
                            size="md"
                            icon={<Plus className="w-4 h-4" />}
                            onClick={() => { setFormData({ ...formData, type: 'in', toAccount: 'cash', fromAccount: '' }); setShowAddTransaction(true); }}
                        >
                            Capital Inflow
                        </Button>
                        <Button
                            variant="danger"
                            size="md"
                            icon={<Minus className="w-4 h-4" />}
                            onClick={() => { setFormData({ ...formData, type: 'out', fromAccount: 'cash', toAccount: '' }); setShowAddTransaction(true); }}
                        >
                            Expenses
                        </Button>
                    </div>
                }
            />

            <CashBankHero
                title="Live Vault Liquidity"
                value={`₹${(position?.cashInHand || 0).toLocaleString('en-IN')}`}
                icon={Wallet}
                stats={
                    <>
                        <div className="px-4 py-2 bg-white/10 rounded-sm backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${(position?.cashInHand || 0) > 0 ? 'bg-success animate-pulse' : 'bg-danger'}`}></span>
                            Operational Status: {(position?.cashInHand || 0) > 0 ? 'Healthy' : 'Depleted'}
                        </div>
                        <button onClick={() => navigate('/cashbank/ledger/cash')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-all underline underline-offset-8">Audit Ledger</button>
                    </>
                }
                extraActions={
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 text-center">Aggregate Inflow</p>
                            <p className="text-xl font-black text-success text-center">₹{transactions.filter(t => t.type === 'in' || (t.type === 'transfer' && t.toAccount === 'cash')).reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-sm">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 text-center">Aggregate Outflow</p>
                            <p className="text-xl font-black text-danger text-center">₹{transactions.filter(t => t.type === 'out' || (t.type === 'transfer' && t.fromAccount === 'cash')).reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                }
            />

            {/* Terminal Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-sm w-fit">
                    {(['all', 'in', 'out'] as const).map(type => (
                        <Button
                            key={type}
                            variant={filterType === type ? 'secondary' : 'tertiary'}
                            size="sm"
                            onClick={() => setFilterType(type)}
                        >
                            {type === 'all' ? 'All Channels' : type === 'in' ? 'Inflows' : 'Outflows'}
                        </Button>
                    ))}
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-400 focus:outline-none"
                    />
                    <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-400 focus:outline-none"
                    />
                </div>
            </div>

            {/* Execution Terminal */}
            <Modal
                isOpen={showAddTransaction}
                onClose={() => setShowAddTransaction(false)}
                title="Transfer money"
                size="xl"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" size="md" type="button" onClick={() => setShowAddTransaction(false)}>
                            Abort
                        </Button>
                        <Button
                            variant={formData.type === 'in' ? 'success' : 'danger'}
                            size="md"
                            type="submit"
                            form="cash-in-hand-form"
                            disabled={isLoading}
                            loading={isLoading}
                        >
                            Commit {formData.type === 'in' ? 'Inflow' : 'Outflow'}
                        </Button>
                    </div>
                }
            >
                    <form id="cash-in-hand-form" onSubmit={handleSubmit}>
                        <p className="text-xs font-medium text-slate-400 -mt-4 mb-6">Recording manual {formData.type === 'in' ? 'Inflow' : 'Outflow'} protocol</p>

                        <div className="space-y-8">
                            <CashBankFormSection title="Clearing Matrix">
                                <CashBankInput label="Execution Date" icon={Calendar}>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-primary transition-all font-bold text-sm"
                                        required
                                    />
                                </CashBankInput>
                                <CashBankInput label="Liquidity Volume (₹)" icon={IndianRupee}>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-primary transition-all font-bold text-sm"
                                        placeholder="0.00"
                                        required
                                    />
                                </CashBankInput>
                            </CashBankFormSection>

                            <CashBankFormSection title="Routing Information">
                                <CashBankInput label="Category / Origin Unit" icon={Navigation}>
                                    <select
                                        value={formData.type === 'in' ? formData.fromAccount : formData.toAccount}
                                        onChange={(e) => {
                                            if (formData.type === 'in') {
                                                setFormData({ ...formData, fromAccount: e.target.value });
                                            } else {
                                                setFormData({ ...formData, toAccount: e.target.value });
                                            }
                                        }}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-primary transition-all font-bold text-sm bg-no-repeat"
                                        required
                                    >
                                        <option value="">Select Routing Channel</option>
                                        {categories.map(group => (
                                            <optgroup key={group.group} label={group.group.toUpperCase()}>
                                                {group.items.map(item => {
                                                    const val = typeof item === 'string' ? item : item.value;
                                                    const lab = typeof item === 'string' ? item : item.label;
                                                    return (
                                                        <option key={val} value={val}>
                                                            {lab}
                                                        </option>
                                                    );
                                                })}
                                            </optgroup>
                                        ))}
                                    </select>
                                </CashBankInput>
                                <CashBankInput label="Registry Reference" icon={FileText}>
                                    <input
                                        type="text"
                                        value={formData.reference}
                                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-primary transition-all font-bold text-sm"
                                        placeholder="Voucher or Clearing ID"
                                    />
                                </CashBankInput>
                            </CashBankFormSection>

                            <div className="md:col-span-2">
                                <CashBankInput label="Transactional Narrative" icon={History}>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={2}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-primary transition-all font-bold text-sm leading-relaxed"
                                        placeholder="Detailed purpose of manual clearing"
                                        required
                                    />
                                </CashBankInput>
                            </div>

                            {/* Impact Advisory */}
                            {(formData.amount || 0) > 0 && (formData.fromAccount || formData.toAccount) && (
                                <div className="bg-primary-soft dark:bg-primary-soft border border-primary/30 dark:border-primary/30 p-6 rounded-[2rem] flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-sm shadow-sm">
                                            <Zap className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anticipated Impact</p>
                                            <p className="text-xs font-bold text-primary dark:text-primary">
                                                {formData.type === 'in' ? 'Depositing into Vault' : 'Withdrawing from Vault'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New balance</p>
                                        <p className="text-xl font-black text-primary">₹{(formData.type === 'in' ? (position?.cashInHand || 0) + (formData.amount || 0) : (position?.cashInHand || 0) - (formData.amount || 0)).toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
            </Modal>

            {/* Transaction Ledger Grid */}
            <div className="grid grid-cols-1 gap-4 pb-20">
                {filteredTransactions.map(t => {
                    const isIn = t.type === 'in' || (t.type === 'transfer' && t.toAccount === 'cash');
                    return (
                        <div key={t._id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between hover:shadow-lg hover:border-primary/30 dark:hover:border-primary/30 transition-all group">
                            <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-sm flex items-center justify-center transition-transform group-hover:scale-110 ${isIn ? 'bg-success-soft text-success dark:bg-success-soft' : 'bg-danger-soft text-danger dark:bg-danger-soft'}`}>
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
                                <p className={`text-xl font-black ${isIn ? 'text-success' : 'text-danger'}`}>
                                    {isIn ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN')}
                                </p>
                                <button className="p-1 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 hover:bg-primary-soft dark:hover:bg-primary-soft hover:text-primary transition-all">Audit Detalle</button>
                            </div>
                        </div>
                    );
                })}

                {filteredTransactions.length === 0 && (
                    <div className="py-20 bg-slate-50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl flex items-center justify-center text-slate-200 mb-6 font-black text-4xl">
                            ?
                        </div>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">No Temporal Ledger Data</h4>
                        <p className="text-xs font-medium text-slate-400 mt-2">Initialize a capital pulse through the inflow/outflow controls above.</p>
                    </div>
                )}
            </div>
        </div>
    </Layout>
    );
};

export default CashInHand;

