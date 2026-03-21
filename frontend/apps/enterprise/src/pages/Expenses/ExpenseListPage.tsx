import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, Filter, Trash2, Edit2, CheckCircle, Receipt, Plus, Download, RefreshCcw } from 'lucide-react';
import { useExpenses } from "@/features/expense-tracking/lib/useExpenses";
import Layout from "@/shared/ui/Layout";

const ExpenseListPage = () => {
    const { user } = useSelector((state) => state.auth);
    const userRole = user?.role || 'staff';
    const { expenses, loading, deleteExpense, refetch } = useExpenses();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');

    const categories = ['All', ...Array.from(new Set(expenses.map(e => e.category)))];

    const filteredExpenses = expenses.filter(e => {
        const matchesSearch =
            e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.expense_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.category?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = filterCategory === 'All' || e.category === filterCategory;

        return matchesSearch && matchesCategory;
    });

    const isSameDay = (dateString) => {
        const d = new Date(dateString);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    };

    const canEdit = (expense) => {
        const normalizedRole = userRole?.toLowerCase() || '';
        if (normalizedRole === 'owner' || normalizedRole === 'admin') return true;
        return isSameDay(expense.date);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            await deleteExpense(id);
        }
    };

    const handleEdit = (expense) => {
        // Navigate to edit or show modal
        console.log('Edit expense:', expense);
    };

    // Calculate totals
    const totalAmount = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return (
        <Layout>
            <div className="page-shell">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                            <Receipt className="w-6 h-6 text-main" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-neutral-900 dark:text-main tracking-tight">
                                Expense List
                            </h1>
                            <p className="text-sm text-neutral-500">View and manage all expense entries</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={refetch}
                            className="px-4 py-2 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-[var(--erp-bg-sunken)] shadow-sm transition-all"
                        >
                            <RefreshCcw className="w-4 h-4" /> Refresh
                        </button>
                        <button className="px-4 py-2 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-[var(--erp-bg-sunken)] shadow-sm transition-all">
                            <Download className="w-4 h-4" /> Export
                        </button>
                        <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 hover:bg-emerald-700 transition-all">
                            <Plus className="w-4 h-4" /> Add Expense
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[var(--erp-card)] p-4 rounded-2xl border border-default dark:border-default shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Entries</p>
                        <p className="text-2xl font-black text-neutral-900 dark:text-main">{filteredExpenses.length}</p>
                    </div>
                    <div className="bg-white dark:bg-[var(--erp-card)] p-4 rounded-2xl border border-default dark:border-default shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total Amount</p>
                        <p className="text-2xl font-black text-emerald-600">₹{totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-[var(--erp-card)] p-4 rounded-2xl border border-default dark:border-default shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Categories</p>
                        <p className="text-2xl font-black text-neutral-900 dark:text-main">{categories.length - 1}</p>
                    </div>
                    <div className="bg-white dark:bg-[var(--erp-card)] p-4 rounded-2xl border border-default dark:border-default shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Avg per Entry</p>
                        <p className="text-2xl font-black text-neutral-900 dark:text-main">₹{filteredExpenses.length > 0 ? Math.round(totalAmount / filteredExpenses.length).toLocaleString() : 0}</p>
                    </div>
                </div>

                {/* Main Table Card */}
                <div className="bg-white dark:bg-[var(--erp-card)] rounded-2xl border border-default dark:border-default shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-default dark:border-default flex gap-4 items-center">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border-0"
                            />
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded-xl">
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

                    {/* Table */}
                    {loading ? (
                        <div className="p-12 text-center text-neutral-400">Loading expenses...</div>
                    ) : (
                        <div className="overflow-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] border-b border-default dark:border-default">
                                    <tr>
                                        <th className="px-4 py-3 font-bold text-[10px] text-neutral-500 uppercase tracking-widest">Date</th>
                                        <th className="px-4 py-3 font-bold text-[10px] text-neutral-500 uppercase tracking-widest">Number</th>
                                        <th className="px-4 py-3 font-bold text-[10px] text-neutral-500 uppercase tracking-widest">Category</th>
                                        <th className="px-4 py-3 font-bold text-[10px] text-neutral-500 uppercase tracking-widest">Description</th>
                                        <th className="px-4 py-3 font-bold text-[10px] text-neutral-500 uppercase tracking-widest">Method</th>
                                        <th className="px-4 py-3 font-bold text-[10px] text-neutral-500 uppercase tracking-widest text-right">Amount</th>
                                        <th className="px-4 py-3 font-bold text-[10px] text-neutral-500 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-4 py-3 font-bold text-[10px] text-neutral-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                    {filteredExpenses.map(expense => (
                                        <tr key={expense.id} className="hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-bg)]/50 transition-colors">
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                                                {new Date(expense.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                                                {expense.expense_number}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-[var(--erp-bg-sunken)] dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 max-w-xs truncate" title={expense.description}>
                                                {expense.description || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                                {expense.payment_method}
                                            </td>
                                            <td className="px-4 py-3 font-bold text-neutral-900 dark:text-main text-right">
                                                ₹{Number(expense.amount).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span title="Synced" className="text-emerald-500 inline-flex">
                                                    <CheckCircle className="w-4 h-4" />
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEdit(expense) && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEdit(expense)}
                                                                className="p-1.5 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(expense.id)}
                                                                className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
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
                    )}
                </div>
            </div>
                  </div>

        </Layout>
    );
};

export default ExpenseListPage;
