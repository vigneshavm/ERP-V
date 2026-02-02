import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Layout from "../../../components/shared/Layout/Layout";
import FormInput from "../../../components/core/Form/Input";
import { getAllExpenses, createExpense, deleteExpense, reset } from "../../../redux/slices/expenseSlice.ts";
import { getAccounts } from "../../../redux/slices/cashbankSlice.ts";
import { Receipt, Plus, Wallet, Calendar, FileText, TrendingDown, Search, Trash2, CreditCard, Banknote, Building2 } from 'lucide-react';

const Expenses = () => {
    const dispatch = useDispatch();
    const { expenses, isLoading, isError, message } = useSelector(state => state.expense);
    const { accounts } = useSelector(state => state.cashbank);

    const [showAddExpense, setShowAddExpense] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [formData, setFormData] = useState({
        expenseNo: 'EXP-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        category: '',
        amount: 0,
        paymentMethod: 'cash',
        bankAccount: '',
        description: '',
        receipt: null
    });

    const expenseCategories = [
        'Rent', 'Utilities', 'Salaries', 'Transportation', 'Marketing', 'Office Supplies',
        'Maintenance', 'Insurance', 'Professional Fees', 'Miscellaneous'
    ];

    const categoryColors = {
        'Rent': 'bg-purple-50 text-purple-700 border-purple-200',
        'Utilities': 'bg-blue-50 text-blue-700 border-blue-200',
        'Salaries': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Transportation': 'bg-amber-50 text-amber-700 border-amber-200',
        'Marketing': 'bg-pink-50 text-pink-700 border-pink-200',
        'Office Supplies': 'bg-cyan-50 text-cyan-700 border-cyan-200',
        'Maintenance': 'bg-orange-50 text-orange-700 border-orange-200',
        'Insurance': 'bg-indigo-50 text-indigo-700 border-indigo-200',
        'Professional Fees': 'bg-violet-50 text-violet-700 border-violet-200',
        'Miscellaneous': 'bg-slate-50 text-slate-700 border-slate-200'
    };

    const paymentMethodIcons = {
        'cash': <Banknote className="w-3.5 h-3.5" />,
        'bank_transfer': <Building2 className="w-3.5 h-3.5" />,
        'upi': <CreditCard className="w-3.5 h-3.5" />,
        'card': <CreditCard className="w-3.5 h-3.5" />,
        'cheque': <FileText className="w-3.5 h-3.5" />
    };

    useEffect(() => {
        dispatch(getAllExpenses());
        dispatch(getAccounts());
        return () => {
            dispatch(reset());
        };
    }, [dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await dispatch(createExpense(formData));
            setShowAddExpense(false);
            setFormData({
                expenseNo: 'EXP-' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                category: '',
                amount: 0,
                paymentMethod: 'cash',
                bankAccount: '',
                description: '',
                receipt: null
            });
            dispatch(getAllExpenses());
            dispatch(getAccounts());
        } catch (error) {
            console.error('Error creating expense:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await dispatch(deleteExpense(id));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Get current month expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    }).reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Get top category
    const categoryTotals = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
        return acc;
    }, {});
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    // Filter expenses
    const filteredExpenses = expenses.filter((expense) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
            expense.expenseNo?.toLowerCase().includes(searchLower) ||
            expense.category?.toLowerCase().includes(searchLower) ||
            (expense.description || '').toLowerCase().includes(searchLower) ||
            expense.paymentMethod?.toLowerCase().includes(searchLower) ||
            expense.amount?.toString().includes(searchLower)
        );
        const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <Layout>
            {/* Modern Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <Receipt className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>
                        <p className="text-slate-500 text-sm">Track and manage business expenses</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddExpense(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-sm font-medium rounded-xl hover:from-rose-700 hover:to-rose-800 transition-all shadow-lg shadow-rose-500/25"
                >
                    <Plus className="w-4 h-4" />
                    Add Expense
                </button>
            </div>

            {/* Error Message */}
            {isError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{message}</p>
                </div>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-red-600" />
                        </div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-slate-500 mt-1">Total Expenses</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Monthly</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">₹{thisMonthExpenses.toLocaleString('en-IN')}</p>
                    <p className="text-sm text-slate-500 mt-1">This Month</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Count</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{expenses.length}</p>
                    <p className="text-sm text-slate-500 mt-1">Total Entries</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                            <TrendingDown className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Top</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{topCategory ? topCategory[0] : '—'}</p>
                    <p className="text-sm text-slate-500 mt-1">Highest Category</p>
                </div>
            </div>

            {/* Filter Island */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="w-full sm:w-96 relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                        >
                            <option value="all">All Categories</option>
                            {expenseCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <span className="text-sm text-slate-500 whitespace-nowrap">
                            {filteredExpenses.length} of {expenses.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Premium Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 text-sm">Loading expenses...</p>
                    </div>
                ) : filteredExpenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <Receipt className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 text-sm">
                            {searchTerm ? "No expenses match your search" : "No expenses recorded"}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Expense No</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                                    <th className="text-center px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment</th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                                    <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredExpenses.map((expense) => (
                                    <tr key={expense._id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-rose-600">{expense.expenseNo}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(expense.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${categoryColors[expense.category] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-semibold text-slate-900">
                                                ₹{(expense.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 capitalize">
                                                {paymentMethodIcons[expense.paymentMethod]}
                                                {expense.paymentMethod?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                                            {expense.description || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setDeleteConfirm(expense._id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Expense Modal */}
            {showAddExpense && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                                <Receipt className="w-5 h-5 text-rose-600" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Add New Expense</h2>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <FormInput
                                    label="Expense Number"
                                    value={formData.expenseNo}
                                    onChange={(e) => setFormData({ ...formData, expenseNo: e.target.value })}
                                    required
                                />
                                <FormInput
                                    label="Date"
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    required
                                />
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Category <span className="text-red-500">*</span></label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                        required
                                    >
                                        <option value="">Select category</option>
                                        {expenseCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <FormInput
                                    label="Amount"
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                    required
                                />
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="upi">UPI</option>
                                        <option value="card">Card</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                    </select>
                                </div>
                                {formData.paymentMethod === 'bank_transfer' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Select Bank Account</label>
                                        <select
                                            value={formData.bankAccount}
                                            onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                            required
                                        >
                                            <option value="">Choose account</option>
                                            {accounts.map(account => (
                                                <option key={account._id} value={account._id}>
                                                    {account.bankName} - {account.accountType} (₹{account.currentBalance})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="2"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                                        placeholder="Add description..."
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-sm font-medium rounded-xl hover:from-rose-700 hover:to-rose-800 transition-all disabled:opacity-50"
                                >
                                    {isLoading ? 'Saving...' : 'Save Expense'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddExpense(false)}
                                    className="px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">Confirm Delete</h3>
                        </div>
                        <p className="text-slate-600 mb-6 text-sm">
                            Are you sure you want to delete this expense? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Expenses;
