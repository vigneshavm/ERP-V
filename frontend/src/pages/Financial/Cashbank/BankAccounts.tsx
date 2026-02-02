import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import CashBankModal from './components/CashBankModal';
import CashBankInput from './components/CashBankInput';
import CashBankFormSection from './components/CashBankFormSection';
import { getAccounts, createAccount, deleteAccount, reset } from "../../../redux/slices/cashbankSlice";
import { RootState, AppDispatch } from "../../../redux/store";
import { Account } from './types';
import {
    Plus,
    Eye,
    EyeOff,
    ArrowRightLeft,
    Trash2,
    FileText,
    Building2,
    CreditCard,
    Activity,
    ChevronDown,
    ShieldCheck
} from 'lucide-react';

const BankAccounts: React.FC = () => {
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [revealedAccounts, setRevealedAccounts] = useState<Record<string, boolean>>({});
    const [formData, setFormData] = useState<Partial<Account>>({
        bankName: '',
        accountNumber: '',
        accountType: 'Savings',
        branch: '',
        ifsc: '',
        openingBalance: 0
    });

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { accounts, isLoading, isSuccess } = useSelector((state: RootState) => state.cashbank);

    useEffect(() => {
        dispatch(getAccounts());
    }, [dispatch]);

    useEffect(() => {
        if (isSuccess) {
            setShowAddAccount(false);
            setFormData({
                bankName: '',
                accountNumber: '',
                accountType: 'Savings',
                branch: '',
                ifsc: '',
                openingBalance: 0
            });
            dispatch(reset());
        }
    }, [isSuccess, dispatch]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(createAccount(formData));
    };

    const toggleReveal = (id: string) => {
        setRevealedAccounts(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const maskAccountNumber = (number: string) => {
        if (number.length <= 4) return number;
        return '•••• •••• ' + number.slice(-4);
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

    return (
        <Layout>
            <PageHeader
                title="Treasury Units"
                description="Aggregated bank inventory for enterprise liquidity management"
                breadcrumbs={[{ label: 'Treasury', link: '/cashbank/position' }, { label: 'Bank Units' }]}
                actions={
                    <button
                        onClick={() => setShowAddAccount(true)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Initialize Unit
                    </button>
                }
            />

            <div className="grid grid-cols-12 gap-6 mb-8">
                <div className="col-span-12 md:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <Activity className="absolute -top-4 -right-4 w-24 h-24 text-indigo-50 dark:text-indigo-950 opacity-50" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Total Aggregate Balance</p>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white relative z-10">₹{totalBalance.toLocaleString('en-IN')}</h2>
                </div>
                <div className="col-span-12 md:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <Building2 className="absolute -top-4 -right-4 w-24 h-24 text-emerald-50 dark:text-emerald-950 opacity-50" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Active Clearing Units</p>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white relative z-10">{accounts.length} <span className="text-sm font-bold text-slate-400 uppercase">Institutions</span></h2>
                </div>
                <div className="col-span-12 md:col-span-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <ShieldCheck className="absolute -top-4 -right-4 w-24 h-24 text-blue-50 dark:text-blue-950 opacity-50" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Security Protocol</p>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white relative z-10">Active <span className="text-sm font-bold text-slate-400 uppercase">Indexing</span></h2>
                </div>
            </div>

            <CashBankModal
                isOpen={showAddAccount}
                onClose={() => setShowAddAccount(false)}
                title="Unit Initialization"
                subtitle="Register new institutional clearing parameters"
                icon={Building2}
                footer={
                    <>
                        <button type="button" onClick={() => setShowAddAccount(false)} className="px-8 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Abort</button>
                        <button type="submit" form="add-account-form" disabled={isLoading} className="px-10 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-opacity-90 disabled:opacity-50 transition-all">
                            {isLoading ? 'Synchronizing...' : 'Commit Initialization'}
                        </button>
                    </>
                }
            >
                <form id="add-account-form" onSubmit={handleSubmit} className="space-y-8">
                    <CashBankFormSection title="Institutional Details">
                        <CashBankInput label="Institution Name" icon={Building2}>
                            <input
                                type="text"
                                value={formData.bankName}
                                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                placeholder="e.g. HDFC Treasury"
                                required
                            />
                        </CashBankInput>
                        <CashBankInput label="Branch Coordinate" icon={ChevronDown}>
                            <input
                                type="text"
                                value={formData.branch}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                placeholder="Regional Node"
                            />
                        </CashBankInput>
                    </CashBankFormSection>

                    <CashBankFormSection title="Access Parameters">
                        <CashBankInput label="Primary Account ID" icon={CreditCard}>
                            <input
                                type="text"
                                value={formData.accountNumber}
                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                placeholder="Official Identifier"
                                required
                            />
                        </CashBankInput>
                        <CashBankInput label="IFSC Protocol" icon={ShieldCheck}>
                            <input
                                type="text"
                                value={formData.ifsc}
                                onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                placeholder="HDFC0001234"
                                required
                            />
                        </CashBankInput>
                    </CashBankFormSection>

                    <CashBankFormSection title="Liquidity Matrix">
                        <CashBankInput label="Unit Classification" icon={Activity}>
                            <select
                                value={formData.accountType}
                                onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm appearance-none"
                            >
                                <option>Savings</option>
                                <option>Current</option>
                                <option>Overdraft</option>
                            </select>
                        </CashBankInput>
                        <CashBankInput label="Initial Balance Unit" icon={Activity}>
                            <input
                                type="number"
                                value={formData.openingBalance}
                                onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                placeholder="0.00"
                            />
                        </CashBankInput>
                    </CashBankFormSection>
                </form>
            </CashBankModal>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {accounts.map(acc => (
                    <div key={acc._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 transition-transform pointer-events-none">
                            <Building2 className="w-32 h-32" />
                        </div>

                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{acc.bankName}</h3>
                                <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${acc.currentBalance > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                    {acc.accountType} Unit • {acc.branch}
                                </div>
                            </div>
                            <div className="flex gap-1.5">
                                <button onClick={() => toggleReveal(acc._id)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 transition-all">
                                    {revealedAccounts[acc._id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button onClick={() => { if (window.confirm('Wipe unit from registry?')) dispatch(deleteAccount(acc._id)) }} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Registry</span>
                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 font-mono">IFSC: {acc.ifsc}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 tracking-wider">
                                        {revealedAccounts[acc._id] ? acc.accountNumber : maskAccountNumber(acc.accountNumber)}
                                    </p>
                                    <button className="p-1 px-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-[9px] font-black text-indigo-600 uppercase tracking-widest rounded-lg">Primary</button>
                                </div>
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
                                    <h4 className="text-2xl font-black text-emerald-600">₹{acc.currentBalance.toLocaleString('en-IN')}</h4>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/cashbank/ledger/${acc._id}`)}
                                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-200 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                                        title="Audit Terminal"
                                    >
                                        <FileText className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => navigate('/cashbank/transfers', { state: { fromAccount: acc._id } })}
                                        className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                                        title="Execution Clearing"
                                    >
                                        <ArrowRightLeft className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {accounts.length === 0 && (
                    <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-800/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl flex items-center justify-center text-slate-300 mb-6 group-hover:scale-110 transition-all">
                            <Building2 className="w-10 h-10" />
                        </div>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">No Active Clearing Units</h4>
                        <p className="text-xs font-medium text-slate-400 mt-2">Initialize your first institucional unit to begin managing global liquidity.</p>
                        <button onClick={() => setShowAddAccount(true)} className="mt-8 px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none">Start Initialization</button>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default BankAccounts;

