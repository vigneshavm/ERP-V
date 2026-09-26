import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Layout from "../../../components/shared/Layout/index";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import { getAccounts, createTransfer, reset, getCashBankPosition } from "../../../redux/slices/cashbankSlice";
import { RootState, AppDispatch } from "../../../redux/store";
import {
    ArrowRight,
    ArrowRightLeft,
    Building2,
    Wallet,
    IndianRupee,
    FileText,
    Zap,
    Info,
    Activity,
    CheckCircle2,
    AlertCircle,
    Plus
} from 'lucide-react';

interface AccountOption {
    value: string;
    label: string;
    type: string;
    balance: number;
    isBank: boolean;
}

interface AccountPulseProps {
account?: AccountOption;
label: string;
value: string;
onChange: (value: string) => void;
options: AccountOption[];
/** Colours the balance red (the source account can't cover the amount). */
insufficient: boolean;
}

// Module-level so React keeps the same component (and the <select>'s focus) across renders; it
// used to be defined inside Transfers, which remounted it on every render.
const AccountPulse: React.FC<AccountPulseProps> = ({ account, label, value, onChange, options, insufficient }) => (
    <div className="flex-1 space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${account ? 'bg-primary' : 'bg-slate-300'}`}></div>
            {label} Node
        </h3>
        <div className={`relative group transition-all duration-300 ${account ? 'scale-105' : ''}`}>
            <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${account ? 'opacity-50' : 'hidden'}`}></div>
            <div className={`relative bg-white dark:bg-slate-900 border-2 rounded-[2.5rem] p-8 transition-all ${account ? 'border-primary shadow-2xl shadow-indigo-100 dark:shadow-none' : 'border-slate-200 dark:border-slate-800 border-dashed'}`}>
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                >
                    <option value="">Select Unit</option>
                    {options.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>

                <div className="flex flex-col items-center text-center space-y-3 pointer-events-none">
                    <div className={`w-16 h-16 rounded-sm flex items-center justify-center transition-all ${account ? 'bg-primary text-white rotate-12 scale-110 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'}`}>
                        {account ? (account.isBank ? <Building2 className="w-8 h-8" /> : <Wallet className="w-8 h-8" />) : <Plus className="w-8 h-8" />}
                    </div>
                    <div>
                        <h4 className={`text-sm font-black uppercase tracking-tight ${account ? 'text-slate-800 dark:text-white' : 'text-slate-300'}`}>
                            {account ? account.label : `Assign ${label}`}
                        </h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {account ? `${account.type} Unit` : 'Pending Allocation'}
                        </p>
                    </div>
                    {account && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 w-full">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Reserve</p>
                            <p className={`text-lg font-black ${insufficient ? 'text-danger' : 'text-success'}`}>
                                ₹{(account.balance || 0).toLocaleString('en-IN')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
);

const EMPTY_TRANSFER = { fromAccount: '', toAccount: '', amount: 0, description: '' };

const Transfers: React.FC = () => {
    const location = useLocation();
    // Accounts pre-selected by the page that navigated here (e.g. a bank account's "Transfer").
    const [formData, setFormData] = useState(() => ({
        ...EMPTY_TRANSFER,
        fromAccount: location.state?.fromAccount || '',
        toAccount: location.state?.toAccount || ''
    }));

    const dispatch = useDispatch<AppDispatch>();
    const { accounts, isLoading, position } = useSelector((state: RootState) => state.cashbank);

    useEffect(() => {
        dispatch(getAccounts());
        dispatch(getCashBankPosition());
    }, [dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.fromAccount === formData.toAccount) {
            return;
        }
        try {
            await dispatch(createTransfer(formData)).unwrap();
            // Success: clear the form and refresh balances.
            setFormData(EMPTY_TRANSFER);
            dispatch(getAccounts());
            dispatch(getCashBankPosition());
        } catch {
            // Rejected: the slice records the error; keep the form so it can be corrected.
        } finally {
            dispatch(reset());
        }
    };

    const accountOptions: AccountOption[] = [
        ...(accounts || []).map(acc => ({
            value: acc._id || '',
            label: acc.bankName || 'Unknown Bank',
            type: acc.accountType || 'N/A',
            balance: acc.currentBalance || 0,
            isBank: true
        })),
        {
            value: 'cash',
            label: 'Physical Vault',
            type: 'Liquidity',
            balance: position?.cashInHand || 0,
            isBank: false
        }
    ];

    const selectedFrom = accountOptions.find(opt => opt.value === formData.fromAccount);
    const selectedTo = accountOptions.find(opt => opt.value === formData.toAccount);

    const fromBalance = selectedFrom?.balance || 0;
    const insufficientBalance = formData.amount > fromBalance;


    return (
        <Layout>
            <div className="pt-8 space-y-8 pb-20">
                <PageHeader
                    title="Internal Clearing House"
                    description="Coordinate inter-unit liquidity redistribution and capital balancing"
                    breadcrumbs={[{ label: 'Treasury', link: '/cashbank/position' }, { label: 'Clearing' }]}
                />

            <div className="max-w-6xl mx-auto pb-20">
                <form onSubmit={handleSubmit} className="space-y-12">
                    {/* Connectivity Neural Map */}
                    <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12 py-12 px-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
                        <AccountPulse account={selectedFrom} label="Source" value={formData.fromAccount} onChange={fromAccount => setFormData(prev => ({ ...prev, fromAccount }))} options={accountOptions} insufficient={insufficientBalance} />

                        <div className="flex flex-col items-center gap-4 relative">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${selectedFrom && selectedTo ? 'bg-primary text-white shadow-2xl shadow-indigo-200 scale-125 rotate-0' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 -rotate-45'}`}>
                                <ArrowRightLeft className={`w-8 h-8 ${selectedFrom && selectedTo ? 'animate-pulse' : ''}`} />
                            </div>
                            <div className="hidden md:block absolute top-1/2 left-full w-24 h-0.5 bg-gradient-to-r from-indigo-500 to-transparent -translate-y-1/2 -ml-12 pointer-events-none opacity-20"></div>
                            <div className="hidden md:block absolute top-1/2 right-full w-24 h-0.5 bg-gradient-to-l from-indigo-500 to-transparent -translate-y-1/2 -mr-12 pointer-events-none opacity-20"></div>
                        </div>

                        <AccountPulse account={selectedTo} label="Destination" value={formData.toAccount} onChange={toAccount => setFormData(prev => ({ ...prev, toAccount }))} options={accountOptions} insufficient={false} />
                    </div>

                    {/* Execution Parameters */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-primary-soft dark:bg-primary-soft rounded-sm text-primary">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Execution Parameters</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Transfer Volume (₹)</label>
                                    <div className="relative group">
                                        <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-hover:text-primary transition-colors" />
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                            className={`w-full pl-16 pr-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-2 rounded-[2rem] outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all text-2xl font-black ${insufficientBalance ? 'border-danger-line text-danger' : 'border-slate-100 dark:border-slate-700 focus:border-primary'}`}
                                            placeholder="0.00"
                                            required
                                            min="0.01"
                                            step="0.01"
                                        />
                                    </div>
                                    {insufficientBalance && (
                                        <p className="flex items-center gap-1.5 text-[10px] font-bold text-danger ml-1 uppercase leading-none">
                                            <AlertCircle className="w-3 h-3" /> Volume exceeds source unit reserve
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Narrative Log</label>
                                    <div className="relative group h-full">
                                        <FileText className="absolute left-6 top-7 w-6 h-6 text-slate-300 group-hover:text-primary transition-colors" />
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={2}
                                            className="w-full pl-16 pr-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-primary transition-all font-bold text-sm leading-relaxed"
                                            placeholder="Internal transfer purpose..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Impact Surveillance */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl p-10 text-white shadow-2xl relative overflow-hidden group">
                                <Zap className="absolute -top-4 -right-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
                                <div className="relative z-10 space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Balance Impact Log</h4>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-white/10 p-4 rounded-sm backdrop-blur-md">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Source Unit</span>
                                            <span className="text-sm font-black text-danger">
                                                - ₹{formData.amount.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="flex justify-center text-primary">
                                            <ArrowRight className="w-4 h-4 rotate-90" />
                                        </div>
                                        <div className="flex justify-between items-center bg-white/10 p-4 rounded-sm backdrop-blur-md">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Target Unit</span>
                                            <span className="text-sm font-black text-success">
                                                + ₹{formData.amount.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading || !formData.fromAccount || !formData.toAccount || formData.amount <= 0 || insufficientBalance || formData.fromAccount === formData.toAccount}
                                        className="w-full py-5 bg-white text-primary rounded-sm text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Activity className="w-4 h-4 animate-spin" /> Committing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" /> Execute Transfer
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="bg-warning-soft dark:bg-warning-soft border border-warning-line dark:border-warning-line rounded-[2.5rem] p-8 flex items-start gap-4">
                                <div className="p-2 bg-warning-soft dark:bg-warning-soft rounded-xl text-warning">
                                    <Info className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-warning dark:text-warning uppercase tracking-widest leading-none mb-2">Clearing Protocol</p>
                                    <p className="text-[10px] font-medium text-warning dark:text-warning leading-relaxed italic">Verify all institutional parameters before execution. Internal clearing is final and will reflect immediately in global liquidity surveillance.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </Layout>
    );
};

export default Transfers;

