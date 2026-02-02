import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from "../../../redux/store";
import { createTransfer } from "../../../redux/slices/cashbankSlice";
import { X, ArrowRightLeft, ShieldCheck } from 'lucide-react';

interface TransferModalProps {
    accounts: any[];
    onClose: () => void;
    onSuccess: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ accounts, onClose, onSuccess }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [formData, setFormData] = useState({
        fromAccount: '',
        toAccount: '',
        amount: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
            await dispatch(createTransfer({
                ...formData,
                amount: parseFloat(formData.amount)
            })).unwrap();
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-neutral-800 w-full max-w-lg rounded-[3rem] shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden relative">
                <div className="p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-1">Fund Transfer</h3>
                            <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest italic">Internal Liquidity Movement</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-neutral-100 dark:bg-neutral-900 rounded-full text-neutral-400 hover:text-error transition">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">Source Node (From)</label>
                            <select
                                required
                                value={formData.fromAccount}
                                onChange={e => setFormData({ ...formData, fromAccount: e.target.value })}
                                className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-2xl text-sm font-black italic outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono appearance-none"
                            >
                                <option value="">Select Source Account...</option>
                                {accounts.map(acc => (
                                    <option key={acc._id} value={acc._id} disabled={acc._id === formData.toAccount}>
                                        {acc.bankName} - {acc.accountNumber} (₹{acc.currentBalance})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-center -my-2 relative z-10">
                            <div className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-full border border-neutral-200 dark:border-neutral-700">
                                <ArrowRightLeft className="w-5 h-5 text-neutral-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">Destination Node (To)</label>
                            <select
                                required
                                value={formData.toAccount}
                                onChange={e => setFormData({ ...formData, toAccount: e.target.value })}
                                className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-2xl text-sm font-black italic outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono appearance-none"
                            >
                                <option value="">Select Designation Account...</option>
                                {accounts.map(acc => (
                                    <option key={acc._id} value={acc._id} disabled={acc._id === formData.fromAccount}>
                                        {acc.bankName} - {acc.accountNumber}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">Transfer Magnitude (₹)</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-2xl text-sm font-black italic outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">Reference / Memo</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-700 rounded-2xl text-sm font-black italic outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                                placeholder="E.g. Daily Cash Deposit"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !formData.fromAccount || !formData.toAccount || !formData.amount}
                            className="w-full py-5 mt-6 bg-neutral-950 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-neutral-900 transition-all flex items-center justify-center gap-4 border border-neutral-700 disabled:opacity-50"
                        >
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            {loading ? 'Executing Transfer...' : 'Authorize Transfer'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TransferModal;
