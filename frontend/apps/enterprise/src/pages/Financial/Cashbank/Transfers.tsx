import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from "@/shared/ui/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
import { getAccounts, createTransfer, reset, getCashBankPosition } from "@/entities/finance/model/cashbankSlice";
import { RootState, AppDispatch } from "@/app/store/store";
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

const Transfers: React.FC = () => {
    const [formData, setFormData] = useState({
        fromAccount: '',
        toAccount: '',
        amount: 0,
        description: ''
    });
    const [hasShownToast, setHasShownToast] = useState(false);

    const dispatch = useDispatch<AppDispatch>();
    const location = useLocation();
    const navigate = useNavigate();
    const { accounts, isLoading, isTransferSuccess, position } = useSelector((state: RootState) => state.cashbank);

    useEffect(() => {
        dispatch(getAccounts());
        dispatch(getCashBankPosition());
        if (location.state?.fromAccount) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
            setFormData(prev => ({ ...prev, fromAccount: location.state.fromAccount }));
        }
        if (location.state?.toAccount) {
            setFormData(prev => ({ ...prev, toAccount: location.state.toAccount }));
        }
    }, [dispatch, location.state]);

    useEffect(() => {
        if (isTransferSuccess && !hasShownToast) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
            setHasShownToast(true);
            setFormData({
                fromAccount: '',
                toAccount: '',
                amount: 0,
                description: ''
            });
            dispatch(getAccounts());
            dispatch(getCashBankPosition());
        }
        if (!isTransferSuccess && hasShownToast) {
            setHasShownToast(false);
        }
        dispatch(reset());
    }, [isTransferSuccess, dispatch, hasShownToast]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.fromAccount === formData.toAccount) {
            return;
        }
        dispatch(createTransfer(formData));
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

    const AccountPulse: React.FC<{ account?: AccountOption; label: string; placeholder: 'fromAccount' | 'toAccount' }> = ({ account, label, placeholder }) => (
        <div className="flex-1 space-y-4">
            <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${account ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                {label} Node
            </h3>
            <div className={`relative group transition-all duration-300 ${account ? 'scale-105' : ''}`}>
                <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${account ? 'opacity-50' : 'hidden'}`}></div>
                <div className={`relative bg-white dark:bg-[var(--erp-bg)] border-2 rounded-[2.5rem] p-8 transition-all ${account ? 'border-indigo-500 shadow-2xl shadow-indigo-100 dark:shadow-none' : 'border-default dark:border-default border-dashed'}`}>
                    <select
                        value={formData[placeholder] || ''}
                        onChange={(e) => setFormData({ ...formData, [placeholder]: e.target.value })}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        required
                    >
                        <option value="">Select Unit</option>
                        {accountOptions.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>

                    <div className="flex flex-col items-center text-center space-y-3 pointer-events-none">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${account ? 'bg-indigo-600 text-white rotate-12 scale-110 shadow-lg' : 'bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] text-muted'}`}>
                            {account ? (account.isBank ? <Building2 className="w-8 h-8" /> : <Wallet className="w-8 h-8" />) : <Plus className="w-8 h-8" />}
                        </div>
                        <div>
                            <h4 className={`text-sm font-black uppercase tracking-tight ${account ? 'text-main' : 'text-muted'}`}>
                                {account ? account.label : `Assign ${label}`}
                            </h4>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">
                                {account ? `${account.type} Unit` : 'Pending Allocation'}
                            </p>
                        </div>
                        {account && (
                            <div className="mt-4 pt-4 border-t border-default dark:border-default w-full">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Available Reserve</p>
                                <p className={`text-lg font-black ${insufficientBalance && placeholder === 'fromAccount' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    ₹{(account.balance || 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="page-shell">
            <PageHeader
                title="Internal Clearing House"
                description="Coordinate inter-unit liquidity redistribution and capital balancing"
                breadcrumbs={[{ label: 'Treasury', link: '/cashbank/position' }, { label: 'Clearing' }]}
            />

            <div className="max-w-6xl mx-auto pb-20">
                <form onSubmit={handleSubmit} className="space-y-12">
                    {/* Connectivity Neural Map */}
                    <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12 py-12 px-8 bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-card)]/20 rounded-[4rem] border border-default dark:border-default border-dashed">
                        {/* eslint-disable-next-line  */}
                        <AccountPulse account={selectedFrom} label="Source" placeholder="fromAccount" />

                        <div className="flex flex-col items-center gap-4 relative">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${selectedFrom && selectedTo ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-125 rotate-0' : 'bg-slate-200 dark:bg-slate-700 text-muted -rotate-45'}`}>
                                <ArrowRightLeft className={`w-8 h-8 ${selectedFrom && selectedTo ? 'animate-pulse' : ''}`} />
                            </div>
                            <div className="hidden md:block absolute top-1/2 left-full w-24 h-0.5 bg-gradient-to-r from-indigo-500 to-transparent -translate-y-1/2 -ml-12 pointer-events-none opacity-20"></div>
                            <div className="hidden md:block absolute top-1/2 right-full w-24 h-0.5 bg-gradient-to-l from-indigo-500 to-transparent -translate-y-1/2 -mr-12 pointer-events-none opacity-20"></div>
                        </div>

                        {/* eslint-disable-next-line  */}
                        <AccountPulse account={selectedTo} label="Destination" placeholder="toAccount" />
                    </div>

                    {/* Execution Parameters */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-8 bg-white dark:bg-[var(--erp-bg)] border border-default dark:border-default rounded-[3rem] p-10 shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-main uppercase tracking-tight">Execution Parameters</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Transfer Volume (₹)</label>
                                    <div className="relative group">
                                        <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted group-hover:text-indigo-500 transition-colors" />
                                        <input
                                            type="number"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                            className={`w-full pl-16 pr-8 py-6 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-2 rounded-[2rem] outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all text-2xl font-black ${insufficientBalance ? 'border-rose-200 text-rose-600' : 'border-default dark:border-default focus:border-indigo-500'}`}
                                            placeholder="0.00"
                                            required
                                            min="0.01"
                                            step="0.01"
                                        />
                                    </div>
                                    {insufficientBalance && (
                                        <p className="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 ml-1 uppercase leading-none">
                                            <AlertCircle className="w-3 h-3" /> Volume exceeds source unit reserve
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Narrative Log</label>
                                    <div className="relative group h-full">
                                        <FileText className="absolute left-6 top-7 w-6 h-6 text-muted group-hover:text-indigo-500 transition-colors" />
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={2}
                                            className="w-full pl-16 pr-8 py-6 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-2 border-default dark:border-default rounded-[2rem] outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-sm leading-relaxed"
                                            placeholder="Internal transfer purpose..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Impact Surveillance */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                                <Zap className="absolute -top-4 -right-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
                                <div className="relative z-10 space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Balance Impact Log</h4>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Source Unit</span>
                                            <span className="text-sm font-black text-rose-300">
                                                - ₹{formData.amount.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                        <div className="flex justify-center text-indigo-200">
                                            <ArrowRight className="w-4 h-4 rotate-90" />
                                        </div>
                                        <div className="flex justify-between items-center bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Target Unit</span>
                                            <span className="text-sm font-black text-emerald-300">
                                                + ₹{formData.amount.toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading || !formData.fromAccount || !formData.toAccount || formData.amount <= 0 || insufficientBalance || formData.fromAccount === formData.toAccount}
                                        className="w-full py-5 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-[2.5rem] p-8 flex items-start gap-4">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600">
                                    <Info className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-amber-900 dark:text-amber-300 uppercase tracking-widest leading-none mb-2">Clearing Protocol</p>
                                    <p className="text-[10px] font-medium text-amber-800 dark:text-amber-400 leading-relaxed italic">Verify all institutional parameters before execution. Internal clearing is final and will reflect immediately in global liquidity surveillance.</p>
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

