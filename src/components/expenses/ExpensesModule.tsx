
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useExpenses, Expense } from '../../hooks/useExpenses';
import ExpenseDashboard from './ExpenseDashboard';
import ExpenseList from './ExpenseList';
import ExpenseForm from './ExpenseForm';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const ExpensesModule: React.FC = () => {
    const { expenses, createExpense, updateExpense, deleteExpense, loading } = useExpenses();
    const { role } = useSelector((state: RootState) => state.auth);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const handleCreate = async (data: Partial<Expense>) => {
        await createExpense(data);
    };

    const handleUpdate = async (data: Partial<Expense>) => {
        if (editingExpense) {
            await updateExpense(editingExpense.id, data);
            setEditingExpense(null);
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
        <div className="h-full flex flex-col p-6 animate-in fade-in space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">Expenses</h1>
                    <p className="text-sm text-neutral-500 mt-1">Manage and track your business expenditures</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    <span>New Expense</span>
                </button>
            </div>

            {loading && expenses.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-neutral-400">
                    Loading expenses...
                </div>
            ) : (
                <>
                    <ExpenseDashboard expenses={expenses} />
                    <ExpenseList
                        expenses={expenses}
                        onEdit={handleEditClick}
                        onDelete={deleteExpense}
                        userRole={role || 'Staff'}
                    />
                </>
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
