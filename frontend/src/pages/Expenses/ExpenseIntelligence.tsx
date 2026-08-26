import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from "../../redux/store";
import {
    PieChart,
    Search,
    Filter,
    AlertCircle,
    CheckCircle2,
    ShieldAlert,
    History,
    FileText,
    Zap,
    Download,
    CreditCard,
    Smartphone,
    ArrowRightLeft,
    AlertTriangle,
    Info,
    Calendar,
    Wallet,
    Target,
    MoreVertical,
    Clock,
    RefreshCcw,
    Scale,
    TrendingUp,
    Briefcase,
    ShieldCheck,
    ChevronRight,
    UserCircle,
    Receipt,
    DollarSign,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Lock,
    TrendingDown,
    Building2,
    Users,
    MousePointer2,
} from 'lucide-react';
import Layout from "../../components/shared/Layout";

// --- Wings-Grade Types ---

interface ExpenseCategoryMaster {
    id: string;
    name: string;
    parent_category?: string;
    monthly_budget: number;
    approval_required: boolean;
    is_cash_allowed: boolean;
}

interface ExpenseTransaction {
    id: string;
    branch_id: string;
    date: string;
    amount: number;
    category_id: string;
    description: string;
    payment_mode: 'CASH' | 'BANK' | 'PETTY';
    submitted_by: string;
    approved_by?: string;
    receipt_attached: boolean;
    status: 'Pending' | 'Approved' | 'Rejected';
}

interface BranchFinancials {
    branch_id: string;
    branch_name: string;
    total_sales: number;
    gross_profit: number;
    net_profit: number;
}

type BudgetStatus = 'WITHIN_BUDGET' | 'NEAR_LIMIT' | 'OVER_BUDGET';
type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW';

interface CategoryAnalysis {
    category: string;
    monthly_budget: number;
    spent: number;
    forecast_end_month: number;
    status: BudgetStatus;
    impact_on_profit: ImpactLevel;
    recommended_action: string;
    compliance_score: number;
    expense_to_sales_ratio: number;
    is_split_detected: boolean;
}

// --- Component ---

const ExpenseIntelligence: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const tenant_id = user?.tenantId || 'TEN001';

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
    const [viewMode, setViewMode] = useState<'OVERVIEW' | 'BRANCHES' | 'AUDIT'>('OVERVIEW');

    // --- Enterprise Mock Data ---

    const categories: ExpenseCategoryMaster[] = useMemo(() => [
        { id: 'CAT001', name: 'Courier & Delivery', monthly_budget: 80000, approval_required: false, is_cash_allowed: true },
        { id: 'CAT002', name: 'Travel & Conveyance', monthly_budget: 120000, approval_required: true, is_cash_allowed: true },
        { id: 'CAT003', name: 'Staff Welfare', monthly_budget: 45000, approval_required: false, is_cash_allowed: true },
        { id: 'CAT004', name: 'Rent & Electricity', monthly_budget: 500000, approval_required: true, is_cash_allowed: false },
        { id: 'CAT005', name: 'Packaging Materials', monthly_budget: 150000, approval_required: false, is_cash_allowed: true },
    ], []);

    const branchFinancials: BranchFinancials[] = useMemo(() => [
        { branch_id: 'B001', branch_name: 'Chennai - OMR', total_sales: 2500000, gross_profit: 800000, net_profit: 450000 },
        { branch_id: 'B002', branch_name: 'Coimbatore - RS Puram', total_sales: 1800000, gross_profit: 600000, net_profit: 320000 },
        { branch_id: 'B003', branch_name: 'Bangalore - HSR', total_sales: 3200000, gross_profit: 1100000, net_profit: 650000 },
    ], []);

    const transactions: ExpenseTransaction[] = useMemo(() => [
        { id: 'EXP-001', branch_id: 'B001', date: '2026-04-26', amount: 4500,  category_id: 'CAT001', description: 'Blue Dart courier — batch shipment', payment_mode: 'CASH',  submitted_by: 'Madhan',      receipt_attached: false, status: 'Pending'  },
        { id: 'EXP-002', branch_id: 'B001', date: '2026-04-26', amount: 4200,  category_id: 'CAT001', description: 'DTDC delivery charges — Apr W4',    payment_mode: 'CASH',  submitted_by: 'Madhan',      receipt_attached: false, status: 'Rejected' },
        { id: 'EXP-003', branch_id: 'B002', date: '2026-04-25', amount: 15000, category_id: 'CAT002', description: 'Staff travel — client site visit',    payment_mode: 'BANK',  submitted_by: 'Manikandan', approved_by: 'Admin', receipt_attached: true,  status: 'Approved' },
        { id: 'EXP-004', branch_id: 'B001', date: '2026-04-24', amount: 800,   category_id: 'CAT003', description: 'Team lunch — Chennai OMR',            payment_mode: 'PETTY', submitted_by: 'Kishore',     receipt_attached: true,  status: 'Approved' },
        { id: 'EXP-005', branch_id: 'B003', date: '2026-04-23', amount: 48000, category_id: 'CAT005', description: 'Packaging materials — festival stock', payment_mode: 'BANK',  submitted_by: 'Sarah',      approved_by: 'Admin', receipt_attached: true,  status: 'Approved' },
        { id: 'EXP-006', branch_id: 'B002', date: '2026-04-22', amount: 12000, category_id: 'CAT002', description: 'Outstation travel — Coimbatore',      payment_mode: 'BANK',  submitted_by: 'Ravi',        receipt_attached: false, status: 'Pending'  },
        { id: 'EXP-007', branch_id: 'B003', date: '2026-04-21', amount: 35000, category_id: 'CAT004', description: 'Electricity bill — HSR branch Apr',   payment_mode: 'BANK',  submitted_by: 'Sarah',      approved_by: 'Admin', receipt_attached: true,  status: 'Approved' },
        { id: 'EXP-008', branch_id: 'B001', date: '2026-04-20', amount: 5500,  category_id: 'CAT001', description: 'FedEx courier — priority docs',       payment_mode: 'CASH',  submitted_by: 'Kishore',     receipt_attached: false, status: 'Rejected' },
        { id: 'EXP-009', branch_id: 'B002', date: '2026-04-19', amount: 9800,  category_id: 'CAT003', description: 'Staff welfare — birthday celebration', payment_mode: 'PETTY', submitted_by: 'Manikandan',  receipt_attached: true,  status: 'Pending'  },
        { id: 'EXP-010', branch_id: 'B003', date: '2026-04-18', amount: 22000, category_id: 'CAT005', description: 'Carton boxes — restock order',         payment_mode: 'BANK',  submitted_by: 'Ravi',       approved_by: 'Admin', receipt_attached: true,  status: 'Approved' },
    ], []);

    // --- Intelligence Engine ---

    const analysis: CategoryAnalysis[] = useMemo(() => {
        const currentDate = new Date();
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const currentDay = currentDate.getDate();

        return categories.map(cat => {
            const spent = transactions
                .filter(t => t.category_id === cat.id)
                .reduce((sum, t) => sum + t.amount, 0);

            // Forecast logic: Linear extrapolation
            const forecast_end_month = Math.round((spent / currentDay) * daysInMonth) || spent;

            const utilization = spent / cat.monthly_budget;
            let status: BudgetStatus = 'WITHIN_BUDGET';
            if (utilization > 1) status = 'OVER_BUDGET';
            else if (utilization > 0.8) status = 'NEAR_LIMIT';

            const catTransactions = transactions.filter(t => t.category_id === cat.id);
            const withReceipt = catTransactions.filter(t => t.receipt_attached).length;
            const compliance_score = catTransactions.length > 0 ? Math.round((withReceipt / catTransactions.length) * 100) : 100;

            const totalSales = branchFinancials.reduce((sum, b) => sum + b.total_sales, 0);
            const expense_to_sales_ratio = (spent / totalSales) * 100;

            // Simple split detection (Pattern: same user, same category, same day, small amounts)
            const is_split_detected = catTransactions.some((t, i) =>
                catTransactions.some((t2, j) =>
                    i !== j && t.submitted_by === t2.submitted_by && t.date === t2.date && Math.abs(t.amount - t2.amount) < 500
                )
            );

            let impact_on_profit: ImpactLevel = 'LOW';
            if (spent > 100000 || status === 'OVER_BUDGET') impact_on_profit = 'HIGH';
            else if (spent > 50000 || status === 'NEAR_LIMIT') impact_on_profit = 'MEDIUM';

            let recommended_action = "Maintain current spend levels.";
            if (status === 'OVER_BUDGET') {
                recommended_action = cat.name === 'Courier & Delivery'
                    ? "Negotiate flat rates with primary courier or cap per-order spend."
                    : `Tighten approval flow for ${cat.name}.`;
            } else if (compliance_score < 70) {
                recommended_action = "Mandate digital receipt upload for all claims.";
            } else if (is_split_detected) {
                recommended_action = "Investigate potential transaction splitting to bypass limits.";
            }

            return {
                category: cat.name,
                monthly_budget: cat.monthly_budget,
                spent,
                forecast_end_month,
                status,
                impact_on_profit,
                recommended_action,
                compliance_score,
                expense_to_sales_ratio,
                is_split_detected
            };
        });
    }, [categories, transactions, branchFinancials]);

    const totalStats = useMemo(() => {
        const spent = analysis.reduce((sum, a) => sum + a.spent, 0);
        const budget = analysis.reduce((sum, a) => sum + a.monthly_budget, 0);
        const leaks = analysis.filter(a => a.status === 'OVER_BUDGET' || a.is_split_detected || a.compliance_score < 70).length;
        return { spent, budget, leaks };
    }, [analysis]);

    const filteredAnalysis = useMemo(() =>
        analysis.filter(a => a.category.toLowerCase().includes(searchTerm.toLowerCase())),
        [analysis, searchTerm]
    );

    const categoryName = useCallback(
        (id: string) => categories.find(c => c.id === id)?.name ?? id,
        [categories]
    );

    const filteredTransactions = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return transactions.filter(t => {
            const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
            const matchesSearch = !q ||
                t.id.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q) ||
                categoryName(t.category_id).toLowerCase().includes(q) ||
                t.submitted_by.toLowerCase().includes(q) ||
                t.payment_mode.toLowerCase().includes(q);
            return matchesStatus && matchesSearch;
        });
    }, [transactions, statusFilter, searchTerm, categoryName]);

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                            <Zap className="w-6 h-6 text-primary" />
                            Expense Categories Intelligence
                        </h2>
                        <p className="text-sm text-neutral-500 mt-0.5">
                            Autonomous margin protection for <span className="font-bold text-primary">{tenant_id}</span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition-all active:scale-95">
                            <Download className="w-4 h-4" /> Export Report
                        </button>
                        <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95">
                            <Activity className="w-4 h-4" /> Run Leakage Scan
                        </button>
                    </div>
                </div>

                {/* Strategic KPI Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-sm group overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                            <DollarSign className="w-16 h-16" />
                        </div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Total MTD Spend</p>
                        <h3 className="text-2xl font-black tabular-nums">₹{totalStats.spent.toLocaleString()}</h3>
                        <div className="flex items-center gap-1.5 mt-2 text-error">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">+12.4% vs Prev Month</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Budget Utilization</p>
                        <h3 className="text-2xl font-black tabular-nums">{Math.round((totalStats.spent / totalStats.budget) * 100)}%</h3>
                        <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-full mt-3 overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-primary`}
                                style={{ width: `${(totalStats.spent / totalStats.budget) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-800 p-6 rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-sm relative overflow-hidden">
                        <div className={`absolute inset-y-0 left-0 w-1 ${totalStats.leaks > 0 ? 'bg-error animate-pulse' : 'bg-success'}`} />
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Leakage Alerts</p>
                        <h3 className={`text-2xl font-black ${totalStats.leaks > 0 ? 'text-error animate-pulse' : 'text-success'}`}>
                            {totalStats.leaks} <span className="text-xs text-neutral-400 font-black uppercase tracking-tight">Active</span>
                        </h3>
                        <div className="mt-2 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-error" />
                            <span className="text-[10px] font-black text-neutral-500 uppercase">Detection Engine Active</span>
                        </div>
                    </div>

                    <div className="bg-neutral-900 text-white p-6 rounded-sm shadow-xl border border-neutral-800 relative group overflow-hidden">
                        <Zap className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700" />
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1 italic text-primary">Intelligence Advice</p>
                        <h3 className="text-xs font-black italic leading-tight text-neutral-300">
                            {totalStats.spent > totalStats.budget * 0.5
                                ? "Current burn rate exceeds historical average—Enforce petty cash caps."
                                : "Spending is within normal variance—Continue monitoring."}
                        </h3>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="flex border-b border-neutral-100 dark:border-neutral-800 pb-0.5 mt-4 gap-8">
                    <button
                        onClick={() => setViewMode('OVERVIEW')}
                        className={`pb-3 text-sm font-black transition-all relative ${viewMode === 'OVERVIEW' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Category Spend Analysis
                        {viewMode === 'OVERVIEW' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setViewMode('BRANCHES')}
                        className={`pb-3 text-sm font-black transition-all relative ${viewMode === 'BRANCHES' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Branch Variance Reports
                        {viewMode === 'BRANCHES' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setViewMode('AUDIT')}
                        className={`pb-3 text-sm font-black transition-all relative ${viewMode === 'AUDIT' ? 'text-primary' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                        Fraud & Abuse Hub
                        <span className="ml-2 px-1.5 py-0.5 bg-error text-white text-[8px] rounded uppercase">2 Risks</span>
                        {viewMode === 'AUDIT' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                    </button>
                </div>

                {/* Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Content Area */}
                    <div className="lg:col-span-2 space-y-4">

                        {viewMode === 'OVERVIEW' && (
                            <>
                                {/* Search + Status filter bar */}
                                <div className="flex gap-3 mb-4 items-center">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by ID, description, category, submitter..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm text-sm outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-1.5">
                                        {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setStatusFilter(tab)}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                                                    statusFilter === tab
                                                        ? tab === 'Pending'  ? 'bg-amber-100 text-amber-700 dark:bg-warning/20 dark:text-warning'
                                                        : tab === 'Approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-success/20 dark:text-success'
                                                        : tab === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                                                        : 'bg-primary text-white'
                                                        : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                                }`}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Transactions Table */}
                                <div className="bg-white dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm mb-6">
                                    <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Recent Transactions</p>
                                        <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{filteredTransactions.length} records</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
                                                <tr>
                                                    {['Expense ID', 'Description', 'Category', 'Date', 'Mode', 'Submitted By', 'Amount', 'Status'].map(h => (
                                                        <th key={h} className={`px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-neutral-400 ${
                                                            h === 'Amount' ? 'text-right' : h === 'Status' ? 'text-center' : ''
                                                        }`}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                {filteredTransactions.length > 0 ? filteredTransactions.map((tx, idx) => (
                                                    <tr key={tx.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors group">
                                                        <td className="px-5 py-4">
                                                            <span className="font-mono text-xs font-bold text-primary group-hover:underline cursor-pointer">{tx.id}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 max-w-[200px] truncate">{tx.description}</p>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-[10px] font-black uppercase tracking-wider text-neutral-500">{categoryName(tx.category_id)}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">{tx.date}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                                                tx.payment_mode === 'CASH'  ? 'bg-amber-50 text-amber-600 dark:bg-warning/10 dark:text-warning' :
                                                                tx.payment_mode === 'BANK'  ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                                                                'bg-violet-50 text-violet-600 dark:bg-accent/10 dark:text-accent'
                                                            }`}>{tx.payment_mode}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-black">{tx.submitted_by[0]}</div>
                                                                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{tx.submitted_by}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <span className="font-mono text-sm font-black text-neutral-900 dark:text-neutral-100">₹{tx.amount.toLocaleString()}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex justify-center">
                                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                                                    tx.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-success/10 dark:text-success dark:border-success/20' :
                                                                    tx.status === 'Pending'  ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-warning/10 dark:text-warning dark:border-warning/20' :
                                                                    'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                                                }`}>{tx.status}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )) : (
                                                    <tr>
                                                        <td colSpan={8} className="px-5 py-12 text-center text-neutral-400 text-sm italic">
                                                            No transactions match "{searchTerm || statusFilter}"
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Category Analysis Cards */}
                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3">Category Spend Analysis</p>
                                {filteredAnalysis.map((item, idx) => (
                                    <div key={idx} className={`bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[2rem] p-6 shadow-sm group hover:border-primary/40 transition-all ${item.status === 'OVER_BUDGET' ? 'border-l-4 border-l-error' :
                                        item.status === 'NEAR_LIMIT' ? 'border-l-4 border-l-amber-500' : ''
                                        }`}>
                                        <div className="flex flex-col md:flex-row justify-between gap-6">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2.5 rounded-xl ${item.status === 'OVER_BUDGET' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
                                                            }`}>
                                                            <PieChart className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-lg tracking-tight leading-none">{item.category}</h4>
                                                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">MTD Performance</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${item.status === 'OVER_BUDGET' ? 'bg-error text-white' :
                                                            item.status === 'NEAR_LIMIT' ? 'bg-amber-100 text-amber-600' : 'bg-success/10 text-success'
                                                            }`}>
                                                            {item.status.replace('_', ' ')}
                                                        </span>
                                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter mt-1">
                                                            Profit Impact: <span className={item.impact_on_profit === 'HIGH' ? 'text-error' : 'text-neutral-500'}>{item.impact_on_profit}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl">
                                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Monthly Budget</p>
                                                        <p className="text-xs font-black">₹{item.monthly_budget.toLocaleString()}</p>
                                                    </div>
                                                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl">
                                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Spent</p>
                                                        <p className="text-xs font-black">₹{item.spent.toLocaleString()}</p>
                                                    </div>
                                                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl">
                                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Forecast</p>
                                                        <p className={`text-xs font-black ${item.forecast_end_month > item.monthly_budget ? 'text-error' : 'text-success'}`}>
                                                            ₹{item.forecast_end_month.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl">
                                                        <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Exp / Sales</p>
                                                        <p className="text-xs font-black tabular-nums">{item.expense_to_sales_ratio.toFixed(2)}%</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                    <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                    <p className="text-[11px] font-medium leading-relaxed italic text-neutral-600 dark:text-neutral-400">
                                                        "{item.recommended_action}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-neutral-50 dark:border-neutral-800 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="flex gap-4">
                                                <button className="text-[10px] font-black text-neutral-400 hover:text-primary transition-colors flex items-center gap-1.5 uppercase tracking-widest">
                                                    <BarChart3 className="w-3.5 h-3.5" /> Historical Trend
                                                </button>
                                                <button className="text-[10px] font-black text-neutral-400 hover:text-primary transition-colors flex items-center gap-1.5 uppercase tracking-widest">
                                                    <Building2 className="w-3.5 h-3.5" /> Branch Split
                                                </button>
                                            </div>
                                            <button className="px-3 py-1 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                                                Enforce Cap
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {viewMode === 'BRANCHES' && (
                            <div className="bg-white dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="p-4">Branch Name</th>
                                            <th className="p-4">Total Sales</th>
                                            <th className="p-4">Total Expenses</th>
                                            <th className="p-4">Ratio (%)</th>
                                            <th className="p-4">Audit Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {branchFinancials.map((branch, idx) => {
                                            const branchExpenses = transactions.filter(t => t.branch_id === branch.branch_id).reduce((s, e) => s + e.amount, 0);
                                            const ratio = (branchExpenses / branch.total_sales) * 100;
                                            return (
                                                <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                                                    <td className="p-4 font-bold text-sm">{branch.branch_name}</td>
                                                    <td className="p-4 text-sm font-medium tabular-nums">₹{branch.total_sales.toLocaleString()}</td>
                                                    <td className="p-4 text-sm font-medium tabular-nums">₹{branchExpenses.toLocaleString()}</td>
                                                    <td className={`p-4 text-sm font-black tabular-nums ${ratio > 5 ? 'text-error' : 'text-neutral-900'}`}>{ratio.toFixed(2)}%</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${ratio > 5 ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                                                            {ratio > 5 ? 'CRITICAL RATIO' : 'HEALTHY'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {viewMode === 'AUDIT' && (
                            <div className="bg-neutral-900 text-white rounded-[2.5rem] p-10 border border-neutral-800 shadow-2xl relative overflow-hidden group">
                                <ShieldAlert className="absolute -bottom-10 -right-10 w-48 h-48 text-error opacity-5 group-hover:scale-110 transition-transform duration-[1.5s]" />
                                <div className="relative z-10">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-error/20 border border-error/30 rounded-full text-error text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-pulse">
                                        <Target className="w-4 h-4 fill-current" /> High Security Sentinel Active
                                    </div>
                                    <h3 className="text-3xl font-black mb-10 leading-tight">
                                        Fraud Detection Engine <br /> <span className="text-error italic underline decoration-error/30 underline-offset-4">Observation Protocol Zero.</span>
                                    </h3>

                                    <div className="space-y-6">
                                        {analysis.filter(a => a.is_split_detected || a.compliance_score < 70).map((alert, i) => (
                                            <div key={i} className="flex gap-4 p-5 bg-white/5 border border-white/10 rounded-sm backdrop-blur-sm group/alert hover:bg-white/10 transition-all cursor-pointer">
                                                <div className="p-3.5 bg-error/20 text-error rounded-xl h-fit">
                                                    <AlertTriangle className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">{alert.category}</span>
                                                        <span className="px-2 py-0.5 bg-error text-white text-[8px] font-black rounded uppercase">Severe Alert</span>
                                                    </div>
                                                    <p className="font-bold text-sm text-neutral-200">
                                                        {alert.is_split_detected ? "Potential Transaction Splitting behavior detected for limits bypass." : "Abnormality in receipt compliance detected."}
                                                    </p>
                                                    <div className="mt-4 flex items-center justify-between">
                                                        <span className="text-[9px] text-neutral-500 flex items-center gap-1.5 uppercase font-black">
                                                            <Clock className="w-3.5 h-3.5" /> Last Detected: MTD Audit
                                                        </span>
                                                        <button className="text-[10px] font-black text-primary uppercase group-hover/alert:translate-x-1 transition-transform flex items-center gap-1">
                                                            Start Resolution Protocols <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Intelligence Rail */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Compliance Hygiene</h4>

                        <div className="bg-white dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6">Aggregate Audit Score</p>
                            <div className="flex items-center justify-center py-6">
                                <div className="relative">
                                    <svg className="w-40 h-40 transform -rotate-90">
                                        <circle cx="80" cy="80" r="74" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-neutral-100 dark:text-neutral-900" />
                                        <circle cx="80" cy="80" r="74" fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray={465} strokeDashoffset={465 * (1 - 0.78)} className="text-primary" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black">78</span>
                                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Wings Rating</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-center text-neutral-500 font-bold italic leading-relaxed px-4">
                                "Compliance impacted by missing digital signatures in the Travel category globally."
                            </p>
                        </div>

                        <div className="bg-primary text-white p-6 rounded-[2.5rem] shadow-xl shadow-primary/20 relative overflow-hidden group">
                            <Zap className="absolute -top-10 -right-10 w-40 h-40 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                            <div className="relative z-10">
                                <h4 className="font-black text-lg mb-2">Automate Recovery?</h4>
                                <p className="text-[11px] opacity-90 leading-relaxed mb-6">
                                    The Intelligence Agent has identified <span className="font-black underline underline-offset-2">₹12,400</span> in unclaimed GST due to missing receipts.
                                </p>
                                <button className="w-full py-4 bg-white text-primary font-black text-[10px] uppercase tracking-widest rounded-sm hover:bg-neutral-50 transition-all shadow-xl shadow-black/5 active:scale-95">
                                    Enable Auto-Reclaim
                                </button>
                            </div>
                        </div>

                        <div className="p-5 rounded-sm border border-primary/10 bg-primary/5 flex items-start gap-4">
                            <div className="p-2 bg-primary/20 rounded-xl text-primary shrink-0">
                                <Receipt className="w-5 h-5" />
                            </div>
                            <p className="text-[10px] text-neutral-500 font-bold leading-relaxed uppercase tracking-tight">
                                Wings-Grade Expense Control ensures <span className="text-primary italic">Audit Readiness</span> across all branches 24/7 with zero human oversight.
                            </p>
                        </div>

                        {/* Quick Access to Spenders */}
                        <div className="bg-white dark:bg-neutral-800 rounded-sm border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Top Claimants</p>
                            <div className="space-y-4">
                                {[
                                    { name: 'Madhan K.', amount: 48500, count: 12 },
                                    { name: 'Sarah J.', amount: 42000, count: 5 },
                                    { name: 'Kishore B.', amount: 12000, count: 8 },
                                ].map((user, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center font-black text-xs">
                                                {user.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black">{user.name}</p>
                                                <p className="text-[9px] text-neutral-400 uppercase font-black">{user.count} Claims</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black tabular-nums text-neutral-700 dark:text-neutral-300">₹{user.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ExpenseIntelligence;
