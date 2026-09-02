import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from "../../../components/shared/Layout/index";
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
    Trash2,
    Building2,
    CreditCard,
    Activity,
    ChevronDown,
    ShieldCheck,
    Home,
    Car,
    UtensilsCrossed,
    Wallet
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

    const _maskAccountNumber = (number: string) => {
        if (number.length <= 4) return number;
        return '•••• •••• ' + number.slice(-4);
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const totalIncome = 4737580; // Placeholder for demo aesthetic
    const totalExpense = 1822656; // Placeholder for demo aesthetic

    const getAccountIcon = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('hotel') || lowerName.includes('food')) return <UtensilsCrossed className="w-12 h-12 text-warning" />;
        if (lowerName.includes('car') || lowerName.includes('suv')) return <Car className="w-12 h-12 text-blue-500" />;
        if (lowerName.includes('home') || lowerName.includes('rent')) return <Home className="w-12 h-12 text-success" />;
        return <Wallet className="w-12 h-12 text-primary" />;
    };

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="Banking Relationships"
                    description="Configure and monitor institutional liquidity nodes and bank accounts."
                    breadcrumbs={[
                        { label: 'Home', link: '/dashboard' },
                        { label: 'Finance', link: '/finance' },
                        { label: 'Accounts' }
                    ]}
                    actions={
                        <button
                            onClick={() => setShowAddAccount(true)}
                            className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/25 flex items-center gap-2 hover:bg-primary/90 transition-all uppercase tracking-widest"
                        >
                            <Plus className="w-5 h-5" /> Initialize New Unit
                        </button>
                    }
                />

                    {/* Hero Section */}
                    <div className="relative flex flex-col items-center py-10 bg-neutral-50 dark:bg-neutral-900/50 rounded-[3rem] border border-neutral-200 dark:border-neutral-800">
                        <div className="flex flex-col md:flex-row items-center gap-12 w-full justify-center px-8">
                            <div className="flex flex-col items-center text-center">
                                <div className="flex flex-col items-start gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Total Outflow</span>
                                    <span className="text-2xl font-black text-danger tracking-tighter">₹{totalExpense.toLocaleString('en-IN')}</span>
                                </div>
                            </div>

                            {/* Circular Statistics */}
                            <div className="relative w-64 h-64 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90 drop-shadow-2xl">
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r="110"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        className="text-neutral-200 dark:text-neutral-800"
                                    />
                                    <circle
                                        cx="128"
                                        cy="128"
                                        r="110"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="transparent"
                                        strokeDasharray={2 * Math.PI * 110}
                                        strokeDashoffset={2 * Math.PI * 110 * (1 - 0.65)}
                                        strokeLinecap="round"
                                        className="text-primary"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Portfolio Value</span>
                                    <h2 className="text-4xl font-black text-neutral-900 dark:text-white tracking-tighter mb-1">₹{totalBalance.toLocaleString('en-IN')}</h2>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                                        <Activity className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">Stable</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Total Inflow</span>
                                    <span className="text-2xl font-black text-success tracking-tighter">₹{totalIncome.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-neutral-200 dark:bg-neutral-800" />

                    {/* Account List */}
                    <div className="space-y-4">
                        {accounts.map(acc => (
                            <div
                                key={acc._id}
                                className="group relative bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-sm p-8 transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-xl"
                                onClick={() => navigate(`/cashbank/ledger/${acc._id}`)}>
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black text-neutral-200 uppercase tracking-tight">{acc.bankName}</h3>
                                        <div className="flex items-center gap-3">
                                            <div className="px-3 py-1 bg-danger/10 border border-danger/20 rounded-full">
                                                <span className="text-[10px] font-black text-danger">₹{(acc.currentBalance * 0.4).toLocaleString()}</span>
                                            </div>
                                            <div className="px-3 py-1 bg-success/10 border border-success/20 rounded-full">
                                                <span className="text-[10px] font-black text-success">₹{(acc.currentBalance * 1.4).toLocaleString()}</span>
                                            </div>
                                            <div className="px-3 py-1 bg-neutral-800 border border-white/5 rounded-full">
                                                <span className="text-[10px] font-black text-neutral-300">₹{acc.currentBalance.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-sm group-hover:scale-110 transition-transform">
                                        {getAccountIcon(acc.bankName)}
                                    </div>
                                </div>

                                {/* Masked Account Number on Hover or revealed */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleReveal(acc._id); }}
                                        className="p-1.5 hover:bg-white/10 rounded-lg text-neutral-500"
                                    >
                                        {revealedAccounts[acc._id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); if (window.confirm('Wipe unit from registry?')) dispatch(deleteAccount(acc._id)); }}
                                        className="p-1.5 hover:bg-danger/10 rounded-lg text-neutral-500 hover:text-danger"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add Account Trigger */}
                        <div
                            onClick={() => setShowAddAccount(true)}
                            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/5 rounded-[2.5rem] hover:border-success/30 hover:bg-emerald-500/5 transition-all cursor-pointer group"
                        >
                            <div className="w-12 h-12 bg-white/5 rounded-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6 text-success" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-widest text-neutral-500">Initialize New Unit</h4>
                        </div>
                    </div>
                {/* Floating Action Button (Alternative Add Account) */}
                <button
                    onClick={() => setShowAddAccount(true)}
                    className="fixed bottom-10 right-10 w-16 h-16 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-full flex items-center justify-center shadow-[0_10px_40px_-5px_rgba(16,185,129,0.5)] active:scale-95 transition-all border-[6px] border-[#05070a] z-50"
                >
                    <Plus className="w-8 h-8 stroke-[4]" />
                </button>

                <CashBankModal
                    isOpen={showAddAccount}
                    onClose={() => setShowAddAccount(false)}
                    title="New Banking Relationship"
                    subtitle="Configure institutional liquidity nodes"
                    icon={Building2}
                    footer={
                        <>
                            <button type="button" onClick={() => setShowAddAccount(false)} className="px-8 py-3.5 border border-white/5 text-neutral-500 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Abort</button>
                            <button type="submit" form="add-account-form" disabled={isLoading} className="px-10 py-3.5 bg-emerald-500 text-neutral-950 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 disabled:opacity-50 transition-all">
                                {isLoading ? 'Synchronizing...' : 'Commit Initialization'}
                            </button>
                        </>
                    }
                >
                    <form id="add-account-form" onSubmit={handleSubmit} className="space-y-8">
                        <CashBankFormSection title="Institution Details">
                            <CashBankInput label="Financial Institution" icon={Building2}>
                                <input
                                    type="text"
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-900/50 border border-white/5 rounded-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm text-white"
                                    placeholder="e.g. HDFC Treasury"
                                    required
                                />
                            </CashBankInput>
                            <CashBankInput label="Branch Domicile" icon={ChevronDown}>
                                <input
                                    type="text"
                                    value={formData.branch}
                                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-900/50 border border-white/5 rounded-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm text-white"
                                    placeholder="Regional Node"
                                />
                            </CashBankInput>
                        </CashBankFormSection>

                        <CashBankFormSection title="Clearing Identifiers">
                            <CashBankInput label="Account Reference ID" icon={CreditCard}>
                                <input
                                    type="text"
                                    value={formData.accountNumber}
                                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-900/50 border border-white/5 rounded-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm text-white"
                                    placeholder="Official Identifier"
                                    required
                                />
                            </CashBankInput>
                            <CashBankInput label="Interbank Routing Code" icon={ShieldCheck}>
                                <input
                                    type="text"
                                    value={formData.ifsc}
                                    onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-900/50 border border-white/5 rounded-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm text-white"
                                    placeholder="HDFC0001234"
                                    required
                                />
                            </CashBankInput>
                        </CashBankFormSection>

                        <CashBankFormSection title="Liquidity Configuration">
                            <CashBankInput label="Account Classification" icon={Activity}>
                                <select
                                    value={formData.accountType}
                                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-900/50 border border-white/5 rounded-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm text-white appearance-none"
                                >
                                    <option>Savings</option>
                                    <option>Current</option>
                                    <option>Overdraft</option>
                                </select>
                            </CashBankInput>
                            <CashBankInput label="Opening Position" icon={Activity}>
                                <input
                                    type="number"
                                    value={formData.openingBalance}
                                    onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-900/50 border border-white/5 rounded-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-sm text-white"
                                    placeholder="0.00"
                                />
                            </CashBankInput>
                        </CashBankFormSection>
                    </form>
                </CashBankModal>
            </div>
        </Layout>
    );
};

export default BankAccounts;

