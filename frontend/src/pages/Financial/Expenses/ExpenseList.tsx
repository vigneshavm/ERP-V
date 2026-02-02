
import React, { useState } from 'react';
import { Search, Filter, Trash2, Edit2, CheckCircle, Clock } from 'lucide-react';
import { Expense } from "../../../hooks/useExpenses";

interface ExpenseListProps {
    expenses: Expense[];
    onEdit: (expense: Expense) => void;
    onDelete: (id: string) => void;
    userRole: string;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onEdit, onDelete, userRole }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('All');

    const categories = ['All', ...Array.from(new Set(expenses.map(e => e.category)))];

    const filteredExpenses = expenses.filter(e => {
        const matchesSearch =
            e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.expense_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = filterCategory === 'All' || e.category === filterCategory;

        return matchesSearch && matchesCategory;
    });

    const isSameDay = (dateString: string) => {
        const d = new Date(dateString);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    };

    const canEdit = (expense: Expense) => {
        const normalizedRole = userRole?.toLowerCase() || '';
        if (normalizedRole === 'owner' || normalizedRole === 'admin') return true;
        return isSameDay(expense.date);
    };

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex-1 flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-neutral-500" />
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-neutral-500">Date</th>
                            <th className="px-4 py-3 font-semibold text-neutral-500">Number</th>
                            <th className="px-4 py-3 font-semibold text-neutral-500">Category</th>
                            <th className="px-4 py-3 font-semibold text-neutral-500">Description</th>
                            <th className="px-4 py-3 font-semibold text-neutral-500">Method</th>
                            <th className="px-4 py-3 font-semibold text-neutral-500 text-right">Amount</th>
                            <th className="px-4 py-3 font-semibold text-neutral-500 text-center">Status</th>
                            <th className="px-4 py-3 font-semibold text-neutral-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                        {filteredExpenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                                    {new Date(expense.date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                                    {expense.expense_number}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                        {expense.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 max-w-xs truncate" title={expense.description}>
                                    {expense.description || '-'}
                                </td>
                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                    {expense.payment_method}
                                </td>
                                <td className="px-4 py-3 font-bold text-neutral-900 dark:text-white text-right">
                                    ₹{Number(expense.amount).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    {/* Simulated Sync Status - Ideally strictly from DB */}
                                    <span title="Synced to Daily Finance" className="text-success inline-flex">
                                        <CheckCircle className="w-4 h-4" />
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {canEdit(expense) && (
                                            <>
                                                <button
                                                    onClick={() => onEdit(expense)}
                                                    className="p-1.5 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this expense?')) {
                                                            onDelete(expense.id);
                                                        }
                                                    }}
                                                    className="p-1.5 text-neutral-400 hover:text-error hover:bg-error/10 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredExpenses.length === 0 && (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-neutral-400">
                                    No expenses found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpenseList;
