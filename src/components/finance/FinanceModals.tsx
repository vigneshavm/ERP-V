import React from 'react';

interface FinanceModalsProps {
    showExpenseModal: boolean;
    setShowExpenseModal: (val: boolean) => void;
    handleAddExpense: (e: React.FormEvent) => void;
    newExpense: { category: string; amount: string; description: string };
    setNewExpense: (val: any) => void;

    showChequeModal: boolean;
    setShowChequeModal: (val: boolean) => void;
    handleAddCheque: (e: React.FormEvent) => void;
    newCheque: { number: string; bankName: string; payee: string; amount: string; date: string; type: 'ISSUED' | 'RECEIVED' };
    setNewCheque: (val: any) => void;
}

const FinanceModals: React.FC<FinanceModalsProps> = ({
    showExpenseModal, setShowExpenseModal, handleAddExpense, newExpense, setNewExpense,
    showChequeModal, setShowChequeModal, handleAddCheque, newCheque, setNewCheque
}) => {
    return (
        <>
            {showExpenseModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <form onSubmit={handleAddExpense} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-96 transition-colors">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Log Operational Expense</h3>
                        <div className="space-y-3 mb-6">
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Category</label>
                                <select
                                    required
                                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white"
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                >
                                    <option value="">Select Category</option>
                                    <option value="Rent">Rent</option>
                                    <option value="Utility">Utility</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Misc">Misc</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Amount</label>
                                <input type="number" required className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Description</label>
                                <input type="text" required className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">Cancel</button>
                            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded">Save</button>
                        </div>
                    </form>
                </div>
            )}

            {showChequeModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <form onSubmit={handleAddCheque} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl w-96 transition-colors">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Record New Cheque</h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex gap-2">
                                <label className="flex-1 cursor-pointer bg-slate-100 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2">
                                    <input type="radio" name="ctype" checked={newCheque.type === 'ISSUED'} onChange={() => setNewCheque({ ...newCheque, type: 'ISSUED' })} />
                                    <span className="text-sm font-bold text-red-500 dark:text-red-400">Issued (Exp)</span>
                                </label>
                                <label className="flex-1 cursor-pointer bg-slate-100 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2">
                                    <input type="radio" name="ctype" checked={newCheque.type === 'RECEIVED'} onChange={() => setNewCheque({ ...newCheque, type: 'RECEIVED' })} />
                                    <span className="text-sm font-bold text-emerald-500 dark:text-emerald-400">Received (Inc)</span>
                                </label>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Cheque Number</label>
                                <input type="text" required className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white" value={newCheque.number} onChange={e => setNewCheque({ ...newCheque, number: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Bank Name</label>
                                <input type="text" required className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white" value={newCheque.bankName} onChange={e => setNewCheque({ ...newCheque, bankName: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Party Name</label>
                                <input type="text" required className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white" value={newCheque.payee} onChange={e => setNewCheque({ ...newCheque, payee: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Amount</label>
                                <input type="number" required className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white" value={newCheque.amount} onChange={e => setNewCheque({ ...newCheque, amount: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Date</label>
                                <input type="date" required className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-2 text-slate-900 dark:text-white" value={newCheque.date} onChange={e => setNewCheque({ ...newCheque, date: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowChequeModal(false)} className="flex-1 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">Cancel</button>
                            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded">Save Record</button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default FinanceModals;
