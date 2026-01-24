import { useState } from 'react';
import Layout from '../../components/Layout';
import PageHeader from '../../components/PageHeader';
import {
    TrendingDown,
    TrendingUp,
    Calendar,
    CreditCard,
    Plus,
    X,
    Building2,
    User,
    Percent,
    Clock,
    IndianRupee,
    FileText,
    CheckCircle2,
    AlertCircle,
    Activity,
    ChevronRight,
    Wallet,
    Target,
    CalendarClock,
    Banknote
} from 'lucide-react';

const LoanAccounts = () => {
    const [showAddLoan, setShowAddLoan] = useState(false);
    const [showEMISchedule, setShowEMISchedule] = useState(false);
    const [showPayEMI, setShowPayEMI] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [typeFilter, setTypeFilter] = useState('all');

    const [formData, setFormData] = useState({
        lenderName: '',
        loanType: 'borrowed',
        loanAmount: 0,
        interestRate: 0,
        tenure: 12,
        startDate: new Date().toISOString().split('T')[0],
        emiAmount: 0,
        purpose: '',
        notes: ''
    });

    // Sample data
    const loans = [
        {
            id: 1,
            lenderName: 'HDFC Bank',
            loanType: 'borrowed',
            loanAmount: 500000,
            balanceRemaining: 350000,
            interestRate: 10.5,
            emiAmount: 15000,
            tenure: 36,
            paidEMIs: 10,
            status: 'active',
            startDate: '2023-04-01',
            nextEMIDate: '2024-02-01'
        },
        {
            id: 2,
            lenderName: 'ABC Enterprises',
            loanType: 'lent',
            loanAmount: 200000,
            balanceRemaining: 150000,
            interestRate: 12,
            emiAmount: 8000,
            tenure: 24,
            paidEMIs: 6,
            status: 'active',
            startDate: '2023-08-01',
            nextEMIDate: '2024-02-01'
        },
        {
            id: 3,
            lenderName: 'Personal Loan - Mr. Sharma',
            loanType: 'borrowed',
            loanAmount: 100000,
            balanceRemaining: 0,
            interestRate: 8,
            emiAmount: 5000,
            tenure: 20,
            paidEMIs: 20,
            status: 'closed',
            startDate: '2022-06-01',
            nextEMIDate: null
        }
    ];

    const filteredLoans = typeFilter === 'all' ? loans : loans.filter(l => l.loanType === typeFilter);

    const totalBorrowed = loans.filter(l => l.loanType === 'borrowed').reduce((sum, l) => sum + l.balanceRemaining, 0);
    const totalLent = loans.filter(l => l.loanType === 'lent').reduce((sum, l) => sum + l.balanceRemaining, 0);
    const netPosition = totalLent - totalBorrowed;
    const activeLoans = loans.filter(l => l.status === 'active').length;
    const borrowedCount = loans.filter(l => l.loanType === 'borrowed').length;
    const lentCount = loans.filter(l => l.loanType === 'lent').length;

    // Generate EMI schedule
    const generateEMISchedule = (loan) => {
        const schedule = [];
        const monthlyRate = loan.interestRate / 12 / 100;
        let balance = loan.loanAmount;

        for (let i = 1; i <= loan.tenure; i++) {
            const interest = balance * monthlyRate;
            const principal = loan.emiAmount - interest;
            balance -= principal;

            schedule.push({
                emiNo: i,
                emiAmount: loan.emiAmount,
                principal: principal,
                interest: interest,
                balance: Math.max(0, balance),
                status: i <= loan.paidEMIs ? 'paid' : 'pending'
            });
        }
        return schedule;
    };

    const InputWrapper = ({ label, icon: Icon, children }) => (
        <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
            <div className="relative group">
                {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
                {children}
            </div>
        </div>
    );

    return (
        <Layout>
            <PageHeader
                title="Credit Portfolio Console"
                description="Comprehensive liability and receivable management across all credit instruments"
                breadcrumbs={[{ label: 'Treasury', link: '/cashbank/position' }, { label: 'Credit' }]}
                actions={
                    <button
                        onClick={() => setShowAddLoan(true)}
                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Register Obligation
                    </button>
                }
            />

            {/* Immersive Debt/Receivable Banner */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-[3rem] p-12 mb-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform pointer-events-none">
                    <CreditCard className="w-64 h-64" />
                </div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8 items-center">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                            Net Credit Position
                        </div>
                        <h2 className={`text-6xl font-black tracking-tighter ${netPosition >= 0 ? 'text-white' : 'text-rose-300'}`}>
                            {netPosition >= 0 ? '+' : ''}₹{Math.abs(netPosition).toLocaleString('en-IN')}
                        </h2>
                        <p className="text-indigo-200 text-sm font-bold mt-2">
                            {netPosition >= 0 ? 'Net Receivable' : 'Net Payable'}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-8">
                            <div className="px-4 py-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                {activeLoans} Active Obligation{activeLoans !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                    <div className="bg-rose-500/20 rounded-[2rem] p-6 backdrop-blur-md border border-rose-400/30">
                        <div className="flex items-center gap-2 text-rose-200 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                            <TrendingDown className="w-4 h-4" />
                            Total Liabilities
                        </div>
                        <p className="text-3xl font-black text-rose-100">₹{totalBorrowed.toLocaleString('en-IN')}</p>
                        <p className="text-xs font-bold text-rose-200/70 mt-1">{borrowedCount} borrowed obligation{borrowedCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="bg-emerald-500/20 rounded-[2rem] p-6 backdrop-blur-md border border-emerald-400/30">
                        <div className="flex items-center gap-2 text-emerald-200 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                            <TrendingUp className="w-4 h-4" />
                            Total Receivables
                        </div>
                        <p className="text-3xl font-black text-emerald-100">₹{totalLent.toLocaleString('en-IN')}</p>
                        <p className="text-xs font-bold text-emerald-200/70 mt-1">{lentCount} lent obligation{lentCount !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            </div>

            {/* Obligation Type Filter Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <button
                    onClick={() => setTypeFilter(typeFilter === 'borrowed' ? 'all' : 'borrowed')}
                    className={`bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 rounded-[2rem] p-6 transition-all hover:shadow-lg text-left group ${typeFilter === 'borrowed' ? 'ring-4 ring-rose-500/20 scale-[1.02]' : ''}`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <span className="text-3xl font-black text-rose-600">{borrowedCount}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Borrowed (Liabilities)</h4>
                    <p className="text-xs font-bold text-slate-400 mt-1">₹{totalBorrowed.toLocaleString('en-IN')} outstanding</p>
                </button>
                <button
                    onClick={() => setTypeFilter(typeFilter === 'lent' ? 'all' : 'lent')}
                    className={`bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-[2rem] p-6 transition-all hover:shadow-lg text-left group ${typeFilter === 'lent' ? 'ring-4 ring-emerald-500/20 scale-[1.02]' : ''}`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-3xl font-black text-emerald-600">{lentCount}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Lent (Receivables)</h4>
                    <p className="text-xs font-bold text-slate-400 mt-1">₹{totalLent.toLocaleString('en-IN')} outstanding</p>
                </button>
            </div>

            {/* Credit Registry */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Credit Registry
                    </h3>
                    <div className="flex items-center gap-2">
                        {typeFilter !== 'all' && (
                            <button onClick={() => setTypeFilter('all')} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all flex items-center gap-1">
                                <X className="w-3 h-3" /> Clear
                            </button>
                        )}
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            {filteredLoans.length} Obligation{filteredLoans.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {filteredLoans.length === 0 ? (
                    <div className="py-20 bg-slate-50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl flex items-center justify-center text-slate-200 mb-6">
                            <CreditCard className="w-10 h-10" />
                        </div>
                        <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">No Obligations Found</h4>
                        <p className="text-xs font-medium text-slate-400 mt-2">Register a new loan or adjust your filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {filteredLoans.map((loan) => {
                            const isBorrowed = loan.loanType === 'borrowed';
                            const progressPercent = Math.round((loan.paidEMIs / loan.tenure) * 100);
                            const isActive = loan.status === 'active';

                            return (
                                <div key={loan.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 transition-all hover:shadow-xl group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isBorrowed ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'} group-hover:scale-110 transition-transform`}>
                                                {isBorrowed ? <TrendingDown className="w-7 h-7" /> : <TrendingUp className="w-7 h-7" />}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{loan.lenderName}</h4>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${isBorrowed ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    {isBorrowed ? 'Liability' : 'Receivable'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            {loan.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Principal</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">₹{loan.loanAmount.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Rate</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">{loan.interestRate}% p.a.</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">EMI</p>
                                            <p className="text-sm font-black text-slate-800 dark:text-white">₹{loan.emiAmount.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Repayment Progress</span>
                                            <span className="text-xs font-black text-indigo-600">{loan.paidEMIs}/{loan.tenure} EMIs ({progressPercent}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${isBorrowed ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'}`} style={{ width: `${progressPercent}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance Remaining</p>
                                            <p className={`text-xl font-black ${isBorrowed ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                ₹{loan.balanceRemaining.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setSelectedLoan(loan); setShowEMISchedule(true); }}
                                                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest transition-all"
                                            >
                                                Schedule
                                            </button>
                                            {isActive && (
                                                <button
                                                    onClick={() => { setSelectedLoan(loan); setShowPayEMI(true); }}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all"
                                                >
                                                    Pay EMI
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {loan.nextEMIDate && isActive && (
                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500">
                                            <CalendarClock className="w-4 h-4" />
                                            <span>Next EMI: <span className="font-bold text-slate-700 dark:text-white">{new Date(loan.nextEMIDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Loan Modal */}
            {showAddLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Register Obligation</h2>
                                <p className="text-xs font-medium text-slate-400">Add a new loan to the credit portfolio</p>
                            </div>
                            <button onClick={() => setShowAddLoan(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Obligation Type</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, loanType: 'borrowed' })}
                                        className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.loanType === 'borrowed' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                    >
                                        <TrendingDown className="w-4 h-4" /> Borrowed (I Owe)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, loanType: 'lent' })}
                                        className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${formData.loanType === 'lent' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                    >
                                        <TrendingUp className="w-4 h-4" /> Lent (They Owe Me)
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputWrapper label="Lender/Borrower Name" icon={User}>
                                    <input
                                        type="text"
                                        value={formData.lenderName}
                                        onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                        placeholder="Enter name"
                                    />
                                </InputWrapper>
                                <InputWrapper label="Loan Amount (₹)" icon={IndianRupee}>
                                    <input
                                        type="number"
                                        value={formData.loanAmount}
                                        onChange={(e) => setFormData({ ...formData, loanAmount: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                        placeholder="0.00"
                                    />
                                </InputWrapper>
                                <InputWrapper label="Interest Rate (% p.a.)" icon={Percent}>
                                    <input
                                        type="number"
                                        value={formData.interestRate}
                                        onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                        placeholder="0.00"
                                    />
                                </InputWrapper>
                                <InputWrapper label="Tenure (Months)" icon={Clock}>
                                    <input
                                        type="number"
                                        value={formData.tenure}
                                        onChange={(e) => setFormData({ ...formData, tenure: parseInt(e.target.value) || 12 })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                    />
                                </InputWrapper>
                                <InputWrapper label="Start Date" icon={Calendar}>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                    />
                                </InputWrapper>
                                <InputWrapper label="EMI Amount (₹)" icon={Banknote}>
                                    <input
                                        type="number"
                                        value={formData.emiAmount}
                                        onChange={(e) => setFormData({ ...formData, emiAmount: parseFloat(e.target.value) || 0 })}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                        placeholder="0.00"
                                    />
                                </InputWrapper>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Purpose / Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                    placeholder="Purpose of loan..."
                                />
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 sticky bottom-0">
                            <button onClick={() => setShowAddLoan(false)} className="px-8 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Cancel</button>
                            <button className="px-10 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
                                Register Obligation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EMI Schedule Modal */}
            {showEMISchedule && selectedLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{selectedLoan.lenderName}</h2>
                                <p className="text-xs font-medium text-slate-400">Amortization Schedule</p>
                            </div>
                            <button onClick={() => setShowEMISchedule(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Principal</p>
                                    <p className="text-lg font-black text-slate-800 dark:text-white">₹{selectedLoan.loanAmount.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Interest Rate</p>
                                    <p className="text-lg font-black text-slate-800 dark:text-white">{selectedLoan.interestRate}% p.a.</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly EMI</p>
                                    <p className="text-lg font-black text-indigo-600">₹{selectedLoan.emiAmount.toLocaleString('en-IN')}</p>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                                <table className="w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">#</th>
                                            <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">EMI</th>
                                            <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Principal</th>
                                            <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Interest</th>
                                            <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Balance</th>
                                            <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {generateEMISchedule(selectedLoan).map((emi) => (
                                            <tr key={emi.emiNo} className={emi.status === 'paid' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}>
                                                <td className="px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300">{emi.emiNo}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-slate-800 dark:text-white text-right">₹{emi.emiAmount.toFixed(0)}</td>
                                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 text-right">₹{emi.principal.toFixed(0)}</td>
                                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 text-right">₹{emi.interest.toFixed(0)}</td>
                                                <td className="px-4 py-3 text-sm font-bold text-slate-800 dark:text-white text-right">₹{emi.balance.toFixed(0)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${emi.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                                                        {emi.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pay EMI Modal */}
            {showPayEMI && selectedLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Pay EMI</h2>
                                <p className="text-xs font-medium text-slate-400">{selectedLoan.lenderName}</p>
                            </div>
                            <button onClick={() => setShowPayEMI(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="text-center mb-6">
                                <p className="text-4xl font-black text-indigo-600">₹{selectedLoan.emiAmount.toLocaleString('en-IN')}</p>
                                <p className="text-xs font-bold text-slate-400 mt-1">Monthly Installment</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <InputWrapper label="Payment Date" icon={Calendar}>
                                    <input
                                        type="date"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                    />
                                </InputWrapper>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Payment Method</label>
                                    <select className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm">
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cash">Cash</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="upi">UPI</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Reference / Notes</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                                    placeholder="Transaction reference"
                                />
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                            <button onClick={() => setShowPayEMI(false)} className="px-8 py-3.5 border border-slate-200 dark:border-slate-700 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Cancel</button>
                            <button className="px-10 py-3.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default LoanAccounts;
