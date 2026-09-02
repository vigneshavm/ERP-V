import React from 'react';
import { X, Save } from 'lucide-react';

interface FinanceModalsProps {
    showExpenseModal: boolean;
    setShowExpenseModal: (show: boolean) => void;
    handleAddExpense: (e: React.FormEvent) => void;
    newExpense: any;
    setNewExpense: (expense: any) => void;
    showChequeModal: boolean;
    setShowChequeModal: (show: boolean) => void;
    handleAddCheque: (e: React.FormEvent) => void;
    newCheque: any;
    setNewCheque: (cheque: any) => void;
}

const FinanceModals: React.FC<FinanceModalsProps> = ({
    showExpenseModal, setShowExpenseModal, handleAddExpense, newExpense, setNewExpense,
    showChequeModal, setShowChequeModal, handleAddCheque, newCheque, setNewCheque
}) => {
    if (!showExpenseModal && !showChequeModal) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            {showExpenseModal && (
                <div className="bg-white dark:bg-neutral-800 rounded-sm shadow-2xl w-full max-w-md border border-neutral-200 dark:border-neutral-700 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-700">
                        <h3 className="text-xl font-bold">Log New Expense</h3>
                        <button onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition"><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleAddExpense} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Category</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition font-medium"
                                placeholder="e.g. Marketing, Utilities"
                                value={newExpense.category}
                                onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-neutral-400">₹</span>
                                <input
                                    type="number"
                                    className="w-full pl-8 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition font-bold"
                                    placeholder="0.00"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Payment Method</label>
                            <select
                                className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition font-medium"
                                value={newExpense.paymentMethod || 'Cash'}
                                onChange={e => setNewExpense({ ...newExpense, paymentMethod: e.target.value })}
                            >
                                <option value="Cash">Cash</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Card">Card</option>
                                <option value="UPI">UPI</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Description</label>
                            <textarea
                                className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition font-medium"
                                placeholder="Details..."
                                rows={3}
                                value={newExpense.description}
                                onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold uppercase tracking-widest hover:bg-primary/90 transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> Save Record
                        </button>
                    </form>
                </div>
            )}

            {showChequeModal && (
                <div className="bg-white dark:bg-neutral-800 rounded-sm shadow-2xl w-full max-w-md border border-neutral-200 dark:border-neutral-700 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-700">
                        <h3 className="text-xl font-bold">Register Cheque</h3>
                        <button onClick={() => setShowChequeModal(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition"><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleAddCheque} className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Cheque No</label>
                                <input
                                    type="text"
                                    className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition font-mono font-medium"
                                    placeholder="XXXXXX"
                                    value={newCheque.number}
                                    onChange={e => setNewCheque({ ...newCheque, number: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Date</label>
                                <input
                                    type="date"
                                    className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition font-medium"
                                    value={newCheque.date}
                                    onChange={e => setNewCheque({ ...newCheque, date: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Bank Name</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition font-medium"
                                placeholder="Bank Name"
                                value={newCheque.bankName}
                                onChange={e => setNewCheque({ ...newCheque, bankName: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-neutral-400">₹</span>
                                <input
                                    type="number"
                                    className="w-full pl-8 p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition font-bold"
                                    placeholder="0.00"
                                    value={newCheque.amount}
                                    onChange={e => setNewCheque({ ...newCheque, amount: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Payee</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition font-medium"
                                placeholder="Payee Name"
                                value={newCheque.payee}
                                onChange={e => setNewCheque({ ...newCheque, payee: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold uppercase tracking-widest hover:bg-primary/90 transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> Issue Cheque
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default FinanceModals;
