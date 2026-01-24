import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, addTransaction, addCheque, updateChequeStatus } from '../store';
import { Plus } from 'lucide-react';
import { TransactionType, Sector } from '../types/common';

// Sub-components
import FinanceOverview from './finance/FinanceOverview';
import ExpenseManager from './finance/ExpenseManager';
import ChequeLedger from './finance/ChequeLedger';
import FinanceModals from './finance/FinanceModals';

const FinanceTracker: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { transactions, cheques, dailyFinanceRecords } = useSelector((state: RootState) => state.finance);
    const { currentSector, currentBranch, theme } = useSelector((state: RootState) => state.auth);
    const { branches: dbBranches } = useSelector((state: RootState) => state.tenant);
    const { employees, attendance } = useSelector((state: RootState) => state.labor);
    const { salesHistory } = useSelector((state: RootState) => state.pos);

    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EXPENSES' | 'CHEQUES'>('OVERVIEW');
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showChequeModal, setShowChequeModal] = useState(false);

    const [newExpense, setNewExpense] = useState({ category: '', amount: '', description: '' });
    const [newCheque, setNewCheque] = useState<{
        number: string;
        bankName: string;
        payee: string;
        amount: string;
        date: string;
        type: 'ISSUED' | 'RECEIVED';
    }>({
        number: '',
        bankName: '',
        payee: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        type: 'ISSUED'
    });

    const sectorTx = transactions.filter(t => t.sector === currentSector);
    const sectorCheques = cheques.filter(c => c.sector === currentSector);

    const totalSales = (salesHistory
        .filter(s => s.sector === currentSector)
        .reduce((acc, s) => acc + s.total, 0)) +
        (dailyFinanceRecords
            .reduce((acc, curr) => acc + (curr.totalSales || 0), 0));

    const totalExpenses = sectorTx
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => acc + t.amount, 0);

    const sectorLaborCost = employees
        .filter(e => e.sector === currentSector)
        .reduce((acc, emp) => {
            const empAtt = attendance.filter(a => a.employeeId === emp.id && a.status === 'PRESENT');
            const days = empAtt.length;
            return acc + (days * (emp.dailyRate || 0));
        }, 0);

    const netProfit = totalSales - totalExpenses - sectorLaborCost;

    const expensesByCategory = sectorTx
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

    const pieData = Object.keys(expensesByCategory).map(key => ({
        name: key,
        value: expensesByCategory[key]
    }));
    const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(addTransaction({
            id: Math.random().toString(36).substr(2, 9),
            type: TransactionType.EXPENSE,
            category: newExpense.category,
            amount: parseFloat(newExpense.amount),
            date: new Date().toISOString(),
            description: newExpense.description,
            sector: currentSector || Sector.GENERAL,
            branchId: currentBranch === 'All' ? (dbBranches.length > 0 ? dbBranches[0].id : 'Main') : currentBranch
        }));
        setShowExpenseModal(false);
        setNewExpense({ category: '', amount: '', description: '' });
    };

    const handleAddCheque = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCheque.amount || !newCheque.number) return;

        dispatch(addCheque({
            id: Math.random().toString(36).substr(2, 9),
            number: newCheque.number,
            bankName: newCheque.bankName,
            payee: newCheque.payee,
            amount: parseFloat(newCheque.amount),
            date: newCheque.date,
            status: 'PENDING',
            type: newCheque.type,
            sector: currentSector || Sector.GENERAL
        }));
        setShowChequeModal(false);
        setNewCheque({
            number: '',
            bankName: '',
            payee: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            type: 'ISSUED'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex gap-4">
                    {['OVERVIEW', 'EXPENSES', 'CHEQUES'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as 'OVERVIEW' | 'EXPENSES' | 'CHEQUES')}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            {tab === 'OVERVIEW' ? 'P&L Overview' : tab === 'EXPENSES' ? 'Op. Expenses' : 'Bank & Cheques'}
                        </button>
                    ))}
                </div>

                {activeTab === 'EXPENSES' && (
                    <button onClick={() => setShowExpenseModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex gap-2 items-center text-sm font-bold">
                        <Plus className="w-4 h-4" /> Log Expense
                    </button>
                )}
                {activeTab === 'CHEQUES' && (
                    <button onClick={() => setShowChequeModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex gap-2 items-center text-sm font-bold">
                        <Plus className="w-4 h-4" /> New Cheque
                    </button>
                )}
            </div>

            {activeTab === 'OVERVIEW' && (
                <FinanceOverview
                    totalSales={totalSales}
                    totalExpenses={totalExpenses}
                    sectorLaborCost={sectorLaborCost}
                    netProfit={netProfit}
                />
            )}

            {activeTab === 'EXPENSES' && (
                <ExpenseManager
                    pieData={pieData}
                    sectorTx={sectorTx}
                    theme={theme || 'light'}
                    COLORS={COLORS}
                />
            )}

            {activeTab === 'CHEQUES' && (
                <ChequeLedger
                    sectorCheques={sectorCheques}
                    onUpdateStatus={(id, status) => dispatch(updateChequeStatus({ id, status }))}
                />
            )}

            <FinanceModals
                showExpenseModal={showExpenseModal}
                setShowExpenseModal={setShowExpenseModal}
                handleAddExpense={handleAddExpense}
                newExpense={newExpense}
                setNewExpense={setNewExpense}
                showChequeModal={showChequeModal}
                setShowChequeModal={setShowChequeModal}
                handleAddCheque={handleAddCheque}
                newCheque={newCheque}
                setNewCheque={setNewCheque}
            />
        </div>
    );
};

export default FinanceTracker;
