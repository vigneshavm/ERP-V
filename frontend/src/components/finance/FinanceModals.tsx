import React from 'react';
import Modal from '../Modal';
import { DollarSign, Receipt, Clock, Building2, User } from 'lucide-react';

interface FinanceModalsProps {
    showExpenseModal: boolean;
    setShowExpenseModal: (show: boolean) => void;
    handleAddExpense: (e: React.FormEvent) => void;
    newExpense: { category: string; amount: string; description: string };
    setNewExpense: (expense: { category: string; amount: string; description: string }) => void;
    showChequeModal: boolean;
    setShowChequeModal: (show: boolean) => void;
    handleAddCheque: (e: React.FormEvent) => void;
    newCheque: {
        number: string;
        bankName: string;
        payee: string;
        amount: string;
        date: string;
        type: 'ISSUED' | 'RECEIVED';
    };
    setNewCheque: (cheque: any) => void;
}

const FinanceModals: React.FC<FinanceModalsProps> = ({
    showExpenseModal,
    setShowExpenseModal,
    handleAddExpense,
    newExpense,
    setNewExpense,
    showChequeModal,
    setShowChequeModal,
    handleAddCheque,
    newCheque,
    setNewCheque
}) => {
    return (
        <>
            {/* Expense Modal */}
            <Modal
                isOpen={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                title="Log Operational Burn"
                subtitle="Securing sector capital outflow node"
            >
                <form onSubmit={handleAddExpense} className="space-y-6 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Category Hub</label>
                            <select
                                required
                                value={newExpense.category}
                                onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-xs font-black uppercase italic focus:ring-4 focus:ring-primary/10 outline-none transition"
                            >
                                <option value="">Select Domain</option>
                                <option value="UTILITY">Utility / Flow</option>
                                <option value="RENT">Real Estate / Rent</option>
                                <option value="MATERIAL">Material / Inventory</option>
                                <option value="SALARY">Human Capital / Salary</option>
                                <option value="MARKETING">Market Growth / Ads</option>
                                <option value="OTHER">Other Domain</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Value Magnitude (₹)</label>
                            <input
                                type="number"
                                required
                                placeholder="0.00"
                                value={newExpense.amount}
                                onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-xs font-black italic focus:ring-4 focus:ring-primary/10 outline-none transition"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Entity Description</label>
                        <input
                            type="text"
                            required
                            placeholder="Detailed flow identification..."
                            value={newExpense.description}
                            onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                            className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-xs font-black italic focus:ring-4 focus:ring-primary/10 outline-none transition"
                        />
                    </div>
                    <button type="submit" className="w-full py-5 bg-neutral-950 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-neutral-900 transition flex items-center justify-center gap-3">
                        <DollarSign size={16} className="text-primary" /> Authorize Transaction Pulse
                    </button>
                </form>
            </Modal>

            {/* Cheque Modal */}
            <Modal
                isOpen={showChequeModal}
                onClose={() => setShowChequeModal(false)}
                title="Deploy Instrument Node"
                subtitle="Securing bank instrument asset flow"
            >
                <form onSubmit={handleAddCheque} className="space-y-6 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Instrument ID</label>
                            <input
                                type="text"
                                required
                                placeholder="CHQ-XXXXXX"
                                value={newCheque.number}
                                onChange={e => setNewCheque({ ...newCheque, number: e.target.value })}
                                className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-xs font-black italic focus:ring-4 focus:ring-primary/10 outline-none transition"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Magnitude (₹)</label>
                            <input
                                type="number"
                                required
                                placeholder="0.00"
                                value={newCheque.amount}
                                onChange={e => setNewCheque({ ...newCheque, amount: e.target.value })}
                                className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-xs font-black italic focus:ring-4 focus:ring-primary/10 outline-none transition"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Issuing Entity Bank</label>
                            <input
                                type="text"
                                required
                                placeholder="HDFC, SBI, etc..."
                                value={newCheque.bankName}
                                onChange={e => setNewCheque({ ...newCheque, bankName: e.target.value })}
                                className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-xs font-black uppercase italic focus:ring-4 focus:ring-primary/10 outline-none transition"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Payee / Entity</label>
                            <input
                                type="text"
                                required
                                placeholder="Name of party..."
                                value={newCheque.payee}
                                onChange={e => setNewCheque({ ...newCheque, payee: e.target.value })}
                                className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-xs font-black uppercase italic focus:ring-4 focus:ring-primary/10 outline-none transition"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Pulse Direction</label>
                            <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                                <button
                                    type="button"
                                    onClick={() => setNewCheque({ ...newCheque, type: 'RECEIVED' })}
                                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition ${newCheque.type === 'RECEIVED' ? 'bg-success text-white shadow-lg shadow-success/20' : 'text-neutral-400'}`}
                                >
                                    Received
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNewCheque({ ...newCheque, type: 'ISSUED' })}
                                    className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition ${newCheque.type === 'ISSUED' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-neutral-400'}`}
                                >
                                    Issued
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Release Date</label>
                            <input
                                type="date"
                                required
                                value={newCheque.date}
                                onChange={e => setNewCheque({ ...newCheque, date: e.target.value })}
                                className="w-full px-5 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl text-xs font-black italic focus:ring-4 focus:ring-primary/10 outline-none transition"
                            />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-5 bg-neutral-950 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-neutral-900 transition flex items-center justify-center gap-3">
                        <Clock size={16} className="text-primary" /> Authorize Instrument Node
                    </button>
                </form>
            </Modal>
        </>
    );
};

export default FinanceModals;
