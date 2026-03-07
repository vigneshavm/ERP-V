
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Expense } from "../../hooks/useExpenses";
import { useBranchResolver } from "../../hooks/useBranchResolver";

interface ExpenseFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Partial<Expense>) => Promise<any>;
    editingExpense?: Expense | null;
}

const CATEGORIES = ['Travel', 'Rent', 'Electricity', 'Salary', 'Maintenance', 'Office Supplies', 'Marketing', 'Utilities', 'Food & Refreshments', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'UPI', 'Debit Card', 'Credit Card'];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ isOpen, onClose, onSave, editingExpense }) => {
    const { currentBranchId } = useBranchResolver();
    const [formData, setFormData] = useState<Partial<Expense>>({
        date: new Date().toISOString().split('T')[0],
        category: CATEGORIES[0],
        payment_method: 'Cash',
        amount: 0,
        description: '',
        reference: '',
        expense_number: '', // Will be generated or ignored on update
        branch_id: currentBranchId || undefined
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingExpense) {
            setFormData({ ...editingExpense });
        } else {
            // Reset for new entry
            // Generate temp ID for display (backend generates actual ID usually)
            const year = new Date().getFullYear();
            const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            setFormData({
                date: new Date().toISOString().split('T')[0],
                category: CATEGORIES[0],
                payment_method: 'Cash',
                amount: 0,
                description: '',
                reference: '',
                branch_id: currentBranchId || undefined,
                expense_number: `EXP-${year}-${random}`
            });
        }
    }, [editingExpense, isOpen, currentBranchId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Number(formData.amount) <= 0) {
            alert("Amount must be greater than 0");
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            // Error managed by parent hook
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl w-full max-w-lg border border-neutral-200 dark:border-neutral-700 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
                    <h2 className="text-lg font-bold">{editingExpense ? 'Edit Expense' : 'New Expense Entry'}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">Expense #</label>
                            <input
                                type="text"
                                value={formData.expense_number}
                                disabled
                                className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 text-sm font-mono opacity-70 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 text-sm"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">Payment Method</label>
                            <select
                                value={formData.payment_method}
                                onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 text-sm"
                            >
                                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">Amount (₹)</label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 text-xl font-bold text-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">Description / Notes</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 text-sm"
                            placeholder="Details about this expense..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-neutral-500 uppercase mb-1">Reference (Optional)</label>
                        <input
                            type="text"
                            value={formData.reference}
                            onChange={e => setFormData({ ...formData, reference: e.target.value })}
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 text-sm"
                            placeholder="Invoice #, Transaction ID"
                        />
                    </div>
                </form>

                <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-neutral-600 font-medium hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700 rounded-lg">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all flex items-center gap-2"
                    >
                        {isSubmitting ? 'Saving...' : <><Save className="w-4 h-4" /> Save Expense</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExpenseForm;
