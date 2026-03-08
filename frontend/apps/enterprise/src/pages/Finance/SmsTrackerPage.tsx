import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, Layers, History, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import SmsTransactionCard from '../../components/Finance/SmsTransactionCard';
import ExpenseForm from '../../components/Finance/ExpenseForm';
import { useExpenses } from '../../hooks/useExpenses';
import { TableSkeleton } from '../../components/core/Feedback/Skeleton';

const SmsTrackerPage: React.FC = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'converted'>('pending');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showTestInput, setShowTestInput] = useState(false);
    const [testSms, setTestSms] = useState('');
    const [testSender, setTestSender] = useState('HDFCBK');
    const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
    const { createExpense } = useExpenses();

    const fetchTransactions = async () => {
        setIsRefreshing(true);
        try {
            const res = await axios.get('/api/sms-tracker');
            setTransactions(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            toast.error('Failed to fetch SMS transactions');
            setTransactions([]);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleConvert = async (id: string, data: any) => {
        try {
            await axios.post(`/api/sms-tracker/${id}/convert`, data);
            toast.success('SMS converted to expense successfully');
            fetchTransactions();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to convert SMS');
        }
    };

    const handleIgnore = async (id: string) => {
        try {
            await axios.patch(`/api/sms-tracker/${id}/ignore`);
            toast.info('SMS ignored');
            fetchTransactions();
        } catch (err) {
            toast.error('Failed to ignore SMS');
        }
    };

    const handleTestSubmit = async () => {
        if (!testSms) return;
        try {
            await axios.post('/api/sms-tracker/receive', { text: testSms, sender: testSender });
            toast.success('Test SMS parsed and added');
            setTestSms('');
            setShowTestInput(false);
            fetchTransactions();
        } catch (err) {
            toast.error('Failed to process test SMS');
        }
    };

    const handleCreateManualExpense = async (data: any) => {
        try {
            await createExpense(data);
            toast.success('Manual expense recorded successfully');
        } catch (err) {
            toast.error('Failed to record manual expense');
        }
    };

    const filteredTransactions = transactions.filter((t: any) => t.status === filter);

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-display font-black text-main tracking-tight">SMS Expense Tracker</h1>
                    </div>
                    <p className="text-secondary font-medium">Resolve recorded banking SMS into formal expense entries.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsExpenseFormOpen(true)}
                        className="btn-cyber-primary px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
                    >
                        <Plus className="w-4 h-4" />
                        Record Regular Expense
                    </button>
                    <button
                        onClick={() => setShowTestInput(!showTestInput)}
                        className="btn-cyber-primary px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Capture SMS Manually
                    </button>
                    <button
                        onClick={fetchTransactions}
                        disabled={isRefreshing}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-secondary hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Test Input Modal/Form */}
            {showTestInput && (
                <div className="glass-panel p-6 rounded-2xl border border-primary/20 animate-in slide-in-from-top-4">
                    <h3 className="text-lg font-display font-bold text-main mb-4">Manual SMS Entry</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-secondary mb-2">SMS Sender (e.g. HDFCBK, AXISBK)</label>
                            <input
                                type="text"
                                value={testSender}
                                onChange={(e) => setTestSender(e.target.value)}
                                className="w-full bg-surface border border-default rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Paste SMS Content</label>
                            <textarea
                                value={testSms}
                                onChange={(e) => setTestSms(e.target.value)}
                                placeholder="Paste the bank transaction SMS here..."
                                className="w-full bg-surface border border-default rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium h-24"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowTestInput(false)} className="px-4 py-2 text-secondary font-bold hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                            <button onClick={handleTestSubmit} className="btn-cyber-primary px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest whitespace-nowrap">Process & Secure</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats / Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-display font-black text-main">
                            {transactions.filter((t: any) => t.status === 'pending').length}
                        </div>
                        <div className="text-xs font-black uppercase tracking-widest text-secondary">Pending Resolution</div>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-success/10 text-success rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-display font-black text-main">
                            {transactions.filter((t: any) => t.status === 'converted').length}
                        </div>
                        <div className="text-xs font-black uppercase tracking-widest text-secondary">Resolved Entries</div>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                        <History className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-2xl font-display font-black text-main">
                            {transactions.length}
                        </div>
                        <div className="text-xs font-black uppercase tracking-widest text-secondary">Total Processed</div>
                    </div>
                </div>
            </div>

            {/* Tabs & List */}
            <div className="space-y-6">
                <div className="flex border-b border-default">
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-6 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${filter === 'pending' ? 'text-primary' : 'text-secondary hover:text-main'}`}
                    >
                        Resolution Queue
                        {filter === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1"></div>}
                    </button>
                    <button
                        onClick={() => setFilter('converted')}
                        className={`px-6 py-4 text-sm font-black uppercase tracking-widest transition-all relative ${filter === 'converted' ? 'text-primary' : 'text-secondary hover:text-main'}`}
                    >
                        Audit History
                        {filter === 'converted' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1"></div>}
                    </button>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        <TableSkeleton />
                    </div>
                ) : filteredTransactions.length > 0 ? (
                    <div className="grid gap-4">
                        {filteredTransactions.map((t: any) => (
                            <SmsTransactionCard
                                key={t._id}
                                transaction={t}
                                onConvert={handleConvert}
                                onIgnore={handleIgnore}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-neutral-500 mb-4">
                            {filter === 'pending' ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                        </div>
                        <h3 className="text-xl font-display font-bold text-main">
                            {filter === 'pending' ? 'Zero Pending Messages' : 'No History Found'}
                        </h3>
                        <p className="text-secondary mt-1">
                            {filter === 'pending'
                                ? 'All banking SMS have been securely resolved into our records.'
                                : 'No converted transactions found in the audit trail.'}
                        </p>
                    </div>
                )}
            </div>

            <ExpenseForm
                isOpen={isExpenseFormOpen}
                onClose={() => setIsExpenseFormOpen(false)}
                onSave={handleCreateManualExpense}
            />
        </div>
    );
};

export default SmsTrackerPage;
