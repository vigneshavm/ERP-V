import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, FilterX, Receipt, Clock, CheckCircle2, XCircle, MoreVertical, Building2, UserCircle, CreditCard, Landmark, Wallet, Trash2 } from 'lucide-react';
import { useExpenses, Expense } from "../../../hooks/useExpenses";
import { useExpenseCategories } from "../../../hooks/useExpenseCategories";
import ExpenseDashboard from './ExpenseDashboard';
import { useSelector } from 'react-redux';
import { RootState } from "../../../redux/store";
import ExpenseForm from './ExpenseForm';

interface AuthState {
    user: any;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    message: string;
}

const ExpensesModule: React.FC = () => {
    const auth = useSelector((state: RootState & { auth: AuthState }) => state.auth);
    const user = auth.user;
    const role = (user as any)?.role;
    const { expenses, createExpense, updateExpense, deleteExpense, loading } = useExpenses();
    const { categories } = useExpenseCategories();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp =>
            exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.expense_number.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [expenses, searchTerm]);

    const handleCreate = async (data: Partial<Expense>) => {
        await createExpense(data);
        setIsFormOpen(false);
    };

    const handleUpdate = async (data: Partial<Expense>) => {
        if (editingExpense) {
            await updateExpense(editingExpense.id, data);
            setEditingExpense(null);
            setIsFormOpen(false);
        }
    };

    const handleEditClick = (expense: Expense) => {
        setEditingExpense(expense);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingExpense(null);
    };

    return (
        <div className="h-full flex flex-col p-6 animate-in fade-in space-y-6 text-neutral-900 dark:text-neutral-100 pb-16">
            {/* Transactional Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Daily Expenses Ledger</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">Transactional recording layer against Category Masters</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center gap-2 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    <span>Record New Expense</span>
                </button>
            </div>

            {/* Quick Stats Integrated */}
            {loading && expenses.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <Clock className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">Syncing Ledger...</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <ExpenseDashboard expenses={expenses} />

                    {/* Transaction List Layer */}
                    <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-neutral-50 dark:border-neutral-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, Category or Note..."
                                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl text-neutral-400 hover:text-primary transition-colors">
                                    <Filter className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-[10px] font-black text-neutral-400 uppercase tracking-widest border-b border-neutral-100 dark:border-neutral-800">
                                    <tr>
                                        <th className="p-6">Date & ID</th>
                                        <th className="p-6">Category & Branch</th>
                                        <th className="p-6 text-right">Amount</th>
                                        <th className="p-6">Payment Mode</th>
                                        <th className="p-6">Governance</th>
                                        <th className="p-6"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {filteredExpenses.map(expense => (
                                        <tr key={expense.id} className="group hover:bg-neutral-50 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
                                                        <Receipt className="w-5 h-5 text-neutral-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm tracking-tight">{new Date(expense.date).toLocaleDateString()}</p>
                                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter">{expense.expense_number}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <p className="font-black text-sm tracking-tight">{expense.category}</p>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-bold">
                                                            <Building2 className="w-3 h-3" />
                                                            {expense.branch_id || 'Main Branch'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <p className="font-black text-sm italic tabular-nums">₹{expense.amount.toLocaleString()}</p>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    {expense.payment_method === 'CASH' && <Wallet className="w-4 h-4 text-amber-500" />}
                                                    {expense.payment_method === 'BANK' && <Landmark className="w-4 h-4 text-primary" />}
                                                    {expense.payment_method === 'PETTY' && <CreditCard className="w-4 h-4 text-indigo-500" />}
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{expense.payment_method}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-success/10 text-success text-[8px] font-black rounded uppercase tracking-widest flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Approved
                                                    </span>
                                                    <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-tighter">By Admin</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => handleEditClick(expense)}
                                                        className="p-2 text-neutral-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                                                        title="Edit"
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to delete this expense?')) {
                                                                deleteExpense(expense.id);
                                                            }
                                                        }}
                                                        className="p-2 text-neutral-400 hover:text-error hover:bg-error/5 rounded-lg transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <ExpenseForm
                isOpen={isFormOpen}
                onClose={handleFormClose}
                onSave={editingExpense ? handleUpdate : handleCreate}
                editingExpense={editingExpense}
            />
        </div>
    );
};

export default ExpensesModule;
