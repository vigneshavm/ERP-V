import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from "@/redux/store";
import { addTransaction, addCheque, updateChequeStatus } from "@/redux/slices/financeSlice";
import Layout from "@/components/shared/Layout";
import PageHeader from "@/components/shared/Layout/PageHeader";
import {
    TrendingUp,
    TrendingDown,
    Zap,
    Download,
    Plus,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    ArrowRight,
    ShieldCheck,
    AlertCircle,
    DollarSign,
    PieChart,
    Clock,
    Layers,
    Info,
    MoreVertical
} from 'lucide-react';
import { TransactionType, Sector } from "@/types/common";
import { formatCurrency } from "@/utils/helpers";

// Sub-components (Upgraded UI versions)
import FinanceOverviewCard from "@/pages/Financial/FinanceOverview";
import ExpenseManager from "@/pages/Financial/ExpenseManager";
import ChequeLedger from "@/pages/Financial/ChequeLedger";
import FinanceModals from "@/pages/Financial/FinanceModals";

const FinanceOverviewPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { transactions, cheques, dailyFinanceRecords } = useSelector((state: RootState) => state.finance);
    const { currentSector, currentBranch, theme } = useSelector((state: RootState) => state.auth);
    const { branches: dbBranches } = useSelector((state: RootState) => state.tenant);
    const { employees, attendance } = useSelector((state: RootState) => state.labor);
    const { salesHistory } = useSelector((state: RootState) => state.pos);

    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EXPENSES' | 'CHEQUES'>('OVERVIEW');
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showChequeModal, setShowChequeModal] = useState(false);

    // Filter Logic
    const sectorTx = (transactions || []).filter((t: any) => t.sector === currentSector);
    const sectorCheques = (cheques || []).filter((c: any) => c.sector === currentSector);

    const totalSales = useMemo(() => {
        const historySales = (salesHistory || [])
            .filter((s: any) => s.sector === currentSector)
            .reduce((acc: number, s: any) => acc + s.total, 0);
        const dailyRecords = (dailyFinanceRecords || [])
            .reduce((acc: number, curr: any) => acc + (curr.totalSales || 0), 0);
        return historySales + dailyRecords;
    }, [salesHistory, dailyFinanceRecords, currentSector]);

    const totalExpenses = useMemo(() =>
        sectorTx.filter((t: any) => t.type === TransactionType.EXPENSE)
            .reduce((acc: number, t: any) => acc + t.amount, 0)
        , [sectorTx]);

    const sectorLaborCost = useMemo(() =>
        (employees || [])
            .filter((e: any) => e.sector === currentSector)
            .reduce((acc: number, emp: any) => {
                const empAtt = (attendance || []).filter((a: any) => a.employeeId === emp.id && a.status === 'PRESENT');
                const days = empAtt.length;
                return acc + (days * (emp.dailyRate || 0));
            }, 0)
        , [employees, attendance, currentSector]);

    const netProfit = totalSales - totalExpenses - sectorLaborCost;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    const expensesByCategory = useMemo(() =>
        sectorTx.filter((t: any) => t.type === TransactionType.EXPENSE)
            .reduce((acc: Record<string, number>, curr: any) => {
                acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                return acc;
            }, {} as Record<string, number>)
        , [sectorTx]);

    const pieData = Object.keys(expensesByCategory).map(key => ({
        name: key,
        value: expensesByCategory[key]
    }));
    const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

    // --- Modal Handlers ---
    const [newExpense, setNewExpense] = useState({ category: '', amount: '', description: '', paymentMethod: 'Cash' });
    const [newCheque, setNewCheque] = useState({
        number: '', bankName: '', payee: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'ISSUED' as 'ISSUED' | 'RECEIVED'
    });

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(addTransaction({
            id: Math.random().toString(36).substr(2, 9),
            type: TransactionType.EXPENSE,
            category: newExpense.category,
            amount: parseFloat(newExpense.amount),
            date: new Date().toISOString(),
            description: newExpense.description,
            paymentMethod: newExpense.paymentMethod,
            sector: currentSector || Sector.GENERAL,
            branchId: currentBranch === 'All' ? ((dbBranches || []).length > 0 ? dbBranches[0].id : 'Main') : currentBranch
        } as any));
        setShowExpenseModal(false);
        setNewExpense({ category: '', amount: '', description: '', paymentMethod: 'Cash' });
    };

    const handleAddCheque = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCheque.amount || !newCheque.number) return;
        dispatch(addCheque({
            id: Math.random().toString(36).substr(2, 9),
            ...newCheque,
            amount: parseFloat(newCheque.amount),
            status: 'PENDING',
            sector: currentSector || Sector.GENERAL
        }));
        setShowChequeModal(false);
        setNewCheque({ number: '', bankName: '', payee: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'ISSUED' });
    };

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="Financial Intelligence Hub"
                    description={`Real-time capital flow analysis for ${currentSector}`}
                    breadcrumbs={[
                        { label: 'Home', link: '/dashboard' },
                        { label: 'Finance' }
                    ]}
                    actions={
                        <div className="flex gap-3">
                            <button className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95 uppercase tracking-widest">
                                <Download className="w-4 h-4" /> Export Ledger
                            </button>
                            <button
                                onClick={() => activeTab === 'CHEQUES' ? setShowChequeModal(true) : setShowExpenseModal(true)}
                                className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 uppercase tracking-widest"
                            >
                                <Plus className="w-4 h-4" /> Log {activeTab === 'CHEQUES' ? 'Cheque' : 'Transaction'}
                            </button>
                        </div>
                    }
                />

                {/* KPI Pulse Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-neutral-50 dark:bg-neutral-900 rounded-full opacity-50 group-hover:scale-110 transition duration-700" />
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Total Net Flow</p>
                        <h3 className={`text-3xl font-black italic tracking-tighter ${netProfit >= 0 ? 'text-primary' : 'text-error'}`}>
                            ₹{formatCurrency(netProfit)}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            {netProfit >= 0 ? <ArrowUpRight className="w-4 h-4 text-primary" /> : <ArrowDownRight className="w-4 h-4 text-error" />}
                            <span className={`text-[10px] font-black uppercase tracking-tight ${netProfit >= 0 ? 'text-primary' : 'text-error'}`}>
                                {profitMargin.toFixed(1)}% Operating Margin
                            </span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Total Revenue</p>
                        <h3 className="text-3xl font-black text-neutral-900 dark:text-white italic tracking-tighter">
                            ₹{formatCurrency(totalSales)}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <TrendingUp className="w-4 h-4 text-success" />
                            <span className="text-[10px] font-black text-success uppercase">Active Inflow Stream</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden group">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-1">Operating Burn</p>
                        <h3 className="text-3xl font-black text-error italic tracking-tighter">
                            ₹{formatCurrency(totalExpenses + sectorLaborCost)}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-2">
                            <TrendingDown className="w-4 h-4 text-error" />
                            <span className="text-[10px] font-black text-error uppercase">Includes Labor & OpEx</span>
                        </div>
                    </div>

                    <div className="bg-neutral-950 text-white p-6 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                        <Zap className="absolute -top-4 -right-4 w-20 h-20 text-primary opacity-20 group-hover:scale-125 transition duration-1000" />
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[9px] font-black uppercase tracking-[0.2em] mb-2">
                                <Zap className="w-3 h-3 fill-current" /> Agent Protocol
                            </div>
                            <p className="text-xs font-bold leading-relaxed italic pr-4">
                                "Margin is <span className="text-primary underline decoration-2 underline-offset-4">stable</span>. AI recommends optimizing vendor credit terms for Q1."
                            </p>
                            <ArrowRight className="absolute bottom-0 right-0 w-4 h-4 text-primary group-hover:translate-x-1 transition cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* View Controls & Main View */}
                    <div className="lg:col-span-12 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-neutral-800 p-2 rounded-2xl border border-neutral-200 dark:border-neutral-700">
                            <div className="flex p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl w-full md:w-auto">
                                {[
                                    { id: 'OVERVIEW', label: 'P&L Pulse', icon: PieChart },
                                    { id: 'EXPENSES', label: 'Burn Manager', icon: DollarSign },
                                    { id: 'CHEQUES', label: 'Cheque Ledger', icon: Clock }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                            ? 'bg-white dark:bg-neutral-800 text-primary shadow-sm'
                                            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                            }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto px-2">
                                <div className="relative flex-1 md:w-48">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Search Ledger..."
                                        className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition font-medium"
                                    />
                                </div>
                                <button className="p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-500 hover:text-primary transition shadow-sm">
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Dynamics View Container */}
                        <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                            <div className="p-8">
                                {activeTab === 'OVERVIEW' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <FinanceOverviewCard
                                            totalSales={totalSales}
                                            totalExpenses={totalExpenses}
                                            sectorLaborCost={sectorLaborCost}
                                            netProfit={netProfit}
                                        />
                                    </div>
                                )}

                                {activeTab === 'EXPENSES' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <ExpenseManager
                                            pieData={pieData}
                                            sectorTx={sectorTx}
                                            theme={theme || 'light'}
                                            COLORS={COLORS}
                                        />
                                    </div>
                                )}

                                {activeTab === 'CHEQUES' && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <ChequeLedger
                                            sectorCheques={sectorCheques}
                                            onUpdateStatus={(id: string, status: 'CLEARED' | 'BOUNCED') => dispatch(updateChequeStatus({ id, status }))}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Footer Pulse */}
                            <div className="px-8 py-4 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Oracle Sync Active</span>
                                </div>
                                <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest italic">
                                    Last Audit: {new Date().toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium Intelligence Advisory */}
                <div className="bg-neutral-950 text-white p-8 rounded-[3rem] border border-neutral-800 shadow-2xl relative overflow-hidden group">
                    <TrendingUp className="absolute -bottom-10 -right-10 w-48 h-48 text-primary opacity-5 group-hover:scale-110 group-hover:rotate-6 transition duration-1000" />
                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary-light text-[9px] font-black uppercase tracking-[0.2em] mb-4">
                                <ShieldCheck className="w-3.5 h-3.5" /> Capital Protection Active
                            </div>
                            <h4 className="text-3xl font-black mb-4 italic tracking-tighter">Liquid Capital <span className="text-primary underline underline-offset-8">Authority.</span></h4>
                            <p className="text-sm text-neutral-400 font-bold leading-relaxed italic max-w-2xl">
                                Your current operating buffer is <span className="text-white">{(netProfit / 30000).toFixed(1)} months</span>.
                                Wings AI suggests redistributing surplus cash into short-term inventory assets for the upcoming pulse season.
                                Avoid stagnant bank balances to maximize return on capital.
                            </p>
                        </div>
                        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4">
                            <button className="px-8 py-4 bg-white text-neutral-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
                                Run Audit
                            </button>
                            <button className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                Optimization Settings
                            </button>
                        </div>
                    </div>
                </div>

                <FinanceModals
                    showExpenseModal={showExpenseModal}
                    setShowExpenseModal={setShowExpenseModal}
                    handleAddExpense={handleAddExpense}
                    newExpense={newExpense}
                    setNewExpense={setNewExpense}
                    showChequeModal={showChequeModal}
                    setShowChequeModal={setShowChequeModal}
                    handleAddCheque={handleAddCheque}
                    newCheque={newCheque as any}
                    setNewCheque={setNewCheque as any}
                />
            </div>
        </Layout>
    );
};

export default FinanceOverviewPage;
