
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, addTransaction, addCheque, updateChequeStatus } from '../store';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ArrowDownLeft, ArrowUpRight, Plus, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { TransactionType } from '../types/common';


const FinanceTracker: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { transactions, cheques } = useSelector((state: RootState) => state.finance);
    const { currentSector, currentBranch, theme } = useSelector((state: RootState) => state.auth);
    const { branches: dbBranches } = useSelector((state: RootState) => state.tenant);
    const { employees, attendance } = useSelector((state: RootState) => state.labor);
    const { salesHistory } = useSelector((state: RootState) => state.pos);

    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EXPENSES' | 'CHEQUES'>('OVERVIEW');
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showChequeModal, setShowChequeModal] = useState(false);

    // Forms State
    const [newExpense, setNewExpense] = useState({ category: '', amount: '', description: '' });
    // Initialize with specific default values to avoid undefined issues
    const [newCheque, setNewCheque] = useState<{
        number: string;
        bankName: string;
        payee: string;
        amount: string; // Use string for input handling
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

    // Filter Data
    const sectorTx = transactions.filter(t => t.sector === currentSector);

    const sectorCheques = cheques.filter(c => c.sector === currentSector);

    // P&L Calculations
    const totalSales = salesHistory
        .filter(s => s.sector === currentSector)
        .reduce((acc, s) => acc + s.total, 0);

    const totalExpenses = sectorTx
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => acc + t.amount, 0);

    // Calculate Accrued Labor Cost (Liability)
    const sectorLaborCost = employees
        .filter(e => e.sector === currentSector)
        .reduce((acc, emp) => {
            const empAtt = attendance.filter(a => a.employeeId === emp.id && a.status === 'PRESENT');
            const days = empAtt.length;
            // Advances are just pre-payments, expense is the full wage liability
            return acc + (days * emp.dailyRate);
        }, 0);

    const netProfit = totalSales - totalExpenses - sectorLaborCost;

    // Chart Data
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

    // Handlers
    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(addTransaction({
            id: Math.random().toString(36).substr(2, 9),
            type: TransactionType.EXPENSE,
            category: newExpense.category,
            amount: parseFloat(newExpense.amount),
            date: new Date().toISOString(),
            description: newExpense.description,
            sector: currentSector,
            branchId: currentBranch === 'All' ? (dbBranches.find(b => b.sector === currentSector)?.id || 'Main') : currentBranch
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
            sector: currentSector
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

            {/* --- OVERVIEW TAB --- */}
            {activeTab === 'OVERVIEW' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">Total Sales Revenue</p>
                            <h3 className="text-3xl font-bold text-emerald-500 dark:text-emerald-400">₹{totalSales.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">Total Expenses (Ops + Stock)</p>
                            <h3 className="text-3xl font-bold text-red-500 dark:text-red-400">₹{totalExpenses.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2">Est. Labor Cost (Accrued)</p>
                            <h3 className="text-3xl font-bold text-orange-500 dark:text-orange-400">₹{sectorLaborCost.toLocaleString()}</h3>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-800 to-slate-800 dark:from-indigo-900 dark:to-slate-900 p-8 rounded-2xl border border-indigo-700 dark:border-indigo-800 shadow-xl flex items-center justify-between text-white">
                        <div>
                            <p className="text-indigo-200 font-medium mb-1">Real-Time P&L (Net Profit)</p>
                            <h2 className="text-5xl font-bold">₹{netProfit.toLocaleString()}</h2>
                            <p className="text-xs text-indigo-300 mt-2 opacity-70">*Revenue - Expenses - Labor Liability</p>
                        </div>
                        <div className={`p-4 rounded-full ${netProfit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                            {netProfit >= 0 ? <ArrowUpRight className="w-12 h-12 text-emerald-400" /> : <ArrowDownLeft className="w-12 h-12 text-red-400" />}
                        </div>
                    </div>
                </div>
            )}

            {/* --- EXPENSES TAB --- */}
            {activeTab === 'EXPENSES' && (
                <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
                    <div className="lg:w-1/3 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 h-fit transition-colors">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4">Breakdown by Category</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={theme === 'dark' ? "#1e293b" : "#ffffff"} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                            borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                                            color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                                        }}
                                        itemStyle={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                                        formatter={(value) => `₹${value.toLocaleString()}`}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                        {/* Desktop Table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-medium">
                                    <tr>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Description</th>
                                        <th className="p-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {sectorTx.filter(t => t.type === 'EXPENSE').map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="p-4"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-700 dark:text-slate-300">{t.category}</span></td>
                                            <td className="p-4 text-slate-800 dark:text-slate-200">{t.description}</td>
                                            <td className="p-4 text-right font-bold text-red-500 dark:text-red-400">-₹{t.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-700">
                            {sectorTx.filter(t => t.type === 'EXPENSE').length === 0 ? (
                                <div className="p-8 text-center text-slate-500">No expenses recorded.</div>
                            ) : (
                                sectorTx.filter(t => t.type === 'EXPENSE').map(t => (
                                    <div key={t.id} className="p-4 bg-white dark:bg-slate-800">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white">{t.description}</h4>
                                            <span className="font-bold text-red-500 dark:text-red-400">-₹{t.amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                                            <span>{new Date(t.date).toLocaleDateString()}</span>
                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">{t.category}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- CHEQUES TAB --- */}
            {activeTab === 'CHEQUES' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in transition-colors">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 dark:text-white">Cheque Ledger</h3>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            Pending: <span className="text-yellow-500 dark:text-yellow-400 font-bold">{sectorCheques.filter(c => c.status === 'PENDING').length}</span>
                        </div>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-medium">
                            <tr>
                                <th className="p-4">Issue Date</th>
                                <th className="p-4">Cheque No</th>
                                <th className="p-4">Bank</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Party</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {sectorCheques.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(c.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-mono text-slate-700 dark:text-slate-300">{c.number}</td>
                                    <td className="p-4 text-slate-700 dark:text-slate-300">{c.bankName}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${c.type === 'RECEIVED' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                                            {c.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-900 dark:text-white font-medium">{c.payee}</td>
                                    <td className="p-4 text-right font-bold text-slate-900 dark:text-white">₹{c.amount.toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        {c.status === 'PENDING' && <span className="flex items-center justify-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs font-bold"><Clock className="w-3 h-3" /> Pending</span>}
                                        {c.status === 'CLEARED' && <span className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold"><CheckCircle2 className="w-3 h-3" /> Cleared</span>}
                                        {c.status === 'BOUNCED' && <span className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400 text-xs font-bold"><AlertCircle className="w-3 h-3" /> Bounced</span>}
                                    </td>
                                    <td className="p-4 text-center">
                                        {c.status === 'PENDING' && (
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => dispatch(updateChequeStatus({ id: c.id, status: 'CLEARED' }))} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded" title="Mark Cleared"><CheckCircle2 className="w-4 h-4" /></button>
                                                <button onClick={() => dispatch(updateChequeStatus({ id: c.id, status: 'BOUNCED' }))} className="p-1 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded" title="Mark Bounced"><AlertCircle className="w-4 h-4" /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* --- MODALS --- */}
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
        </div>
    );
};

export default FinanceTracker;
