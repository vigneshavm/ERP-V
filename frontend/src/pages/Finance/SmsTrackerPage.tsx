import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw, Layers, History, CheckCircle2, AlertCircle, Plus, Info, Zap } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import SmsTransactionCard from '../../components/Finance/SmsTransactionCard';
import ExpenseForm from '../../components/Finance/ExpenseForm';
import { useExpenses } from '../../hooks/useExpenses';
import { TableSkeleton } from '../../components/core/Feedback/Skeleton';
import Layout from '../../components/shared/Layout/Layout';
import PageHeader from '../../components/shared/Layout/PageHeader';

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
            toast.error('Failed to synchronize SMS transaction nodes.');
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
            toast.success('SMS node successfully resolved into formal ledger.');
            fetchTransactions();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to resolve transaction node.');
        }
    };

    const handleIgnore = async (id: string) => {
        try {
            await axios.patch(`/api/sms-tracker/${id}/ignore`);
            toast.info('Transaction node ignored.');
            fetchTransactions();
        } catch (err) {
            toast.error('Failed to ignore transaction node.');
        }
    };

    const handleTestSubmit = async () => {
        if (!testSms) return;
        try {
            await axios.post('/api/sms-tracker/receive', { text: testSms, sender: testSender });
            toast.success('Test SMS capture initialized.');
            setTestSms('');
            setShowTestInput(false);
            fetchTransactions();
        } catch (err) {
            toast.error('Capture protocol failed.');
        }
    };

    const handleCreateManualExpense = async (data: any) => {
        try {
            await createExpense(data);
            toast.success('Manual expense entry recorded.');
        } catch (err) {
            toast.error('Failed to record manual expense.');
        }
    };

    const filteredTransactions = transactions.filter((t: any) => t.status === filter);

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="SMS Intelligence Node"
                    description="Autonomous capture and resolution of institutional banking SMS."
                    breadcrumbs={[
                        { label: 'Home', link: '/dashboard' },
                        { label: 'Finance', link: '/finance' },
                        { label: 'SMS Tracker' }
                    ]}
                    actions={
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsExpenseFormOpen(true)}
                                className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95 uppercase tracking-widest"
                            >
                                <Plus className="w-4 h-4" /> Manual Record
                            </button>
                            <button
                                onClick={() => setShowTestInput(!showTestInput)}
                                className="px-5 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-black shadow-xl flex items-center gap-2 hover:opacity-90 transition active:scale-95 uppercase tracking-widest"
                            >
                                <MessageSquare className="w-4 h-4" /> Capture SMS
                            </button>
                            <button
                                onClick={fetchTransactions}
                                disabled={isRefreshing}
                                className="p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    }
                />

                {/* Manual Capture Console */}
                {showTestInput && (
                    <div className="bg-neutral-950 text-white p-8 rounded-[3rem] border border-neutral-800 shadow-2xl animate-in slide-in-from-top-6 duration-700 relative overflow-hidden group">
                        <Zap className="absolute -top-10 -right-10 w-48 h-48 text-primary opacity-5 group-hover:scale-110 transition duration-1000" />
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/20 rounded-sm flex items-center justify-center text-primary">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">Manual SMS Capture Protocol</h3>
                                    <p className="text-[10px] text-neutral-400 font-bold italic mt-1">Directly inject transaction strings for intelligence processing.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3">Institutional Sender</label>
                                    <input
                                        type="text"
                                        value={testSender}
                                        onChange={(e) => setTestSender(e.target.value)}
                                        placeholder="e.g., HDFCBK"
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-sm px-5 py-3 text-sm focus:ring-2 focus:ring-primary/40 transition-all font-mono font-bold tracking-tighter uppercase"
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-3">Transaction SMS Payload</label>
                                    <textarea
                                        value={testSms}
                                        onChange={(e) => setTestSms(e.target.value)}
                                        placeholder="Paste the bank transaction string here..."
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-sm px-5 py-3 text-sm focus:ring-2 focus:ring-primary/40 transition-all font-bold italic h-16"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4">
                                <button onClick={() => setShowTestInput(false)} className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">Abort Capture</button>
                                <button onClick={handleTestSubmit} className="px-8 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Execute Capture Node</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* KPI Pulse Node Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center gap-6 group hover:border-warning/30 transition-all duration-500">
                        <div className="w-16 h-16 bg-warning/10 text-warning rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                            <Layers className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="text-4xl font-black text-neutral-900 dark:text-white tracking-tighter tabular-nums">
                                {transactions.filter((t: any) => t.status === 'pending').length}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mt-1 italic">Pending Resolution</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center gap-6 group hover:border-success/30 transition-all duration-500">
                        <div className="w-16 h-16 bg-success/10 text-success rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="text-4xl font-black text-neutral-900 dark:text-white tracking-tighter tabular-nums">
                                {transactions.filter((t: any) => t.status === 'converted').length}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mt-1 italic">Resolved Nodes</div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-neutral-800 p-8 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm flex items-center gap-6 group hover:border-primary/30 transition-all duration-500">
                        <div className="w-16 h-16 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                            <History className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="text-4xl font-black text-neutral-900 dark:text-white tracking-tighter tabular-nums">
                                {transactions.length}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mt-1 italic">Total Synchronized</div>
                        </div>
                    </div>
                </div>

                {/* Resolution Workspace */}
                <div className="space-y-8">
                    <div className="flex gap-4 p-1.5 bg-neutral-50 dark:bg-neutral-900 rounded-sm border border-neutral-100 dark:border-neutral-800 self-start">
                        <button
                            onClick={() => setFilter('pending')}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'pending'
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xl'
                                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                                }`}
                        >
                            Resolution Queue
                        </button>
                        <button
                            onClick={() => setFilter('converted')}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'converted'
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xl'
                                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                                }`}
                        >
                            Audit History
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="space-y-6">
                            <TableSkeleton />
                        </div>
                    ) : filteredTransactions.length > 0 ? (
                        <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
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
                        <div className="py-32 flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-40">
                            <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-900 rounded-[2.5rem] flex items-center justify-center text-neutral-400 mb-8">
                                {filter === 'pending' ? <CheckCircle2 className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
                            </div>
                            <h3 className="text-xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter italic">
                                {filter === 'pending' ? 'Zero Pending Node Alerts' : 'Empty Audit Trail'}
                            </h3>
                            <p className="text-xs font-bold text-neutral-500 mt-3 italic leading-relaxed uppercase tracking-widest">
                                {filter === 'pending'
                                    ? 'All institutional banking SMS have been securely resolved into our records.'
                                    : 'No previously converted nodes found in the audit history.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Intelligence Advisory Footer */}
                <div className="bg-neutral-900 dark:bg-neutral-100 p-10 rounded-[3rem] shadow-2xl flex items-center gap-8 group">
                    <div className="w-14 h-14 rounded-sm bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        <Zap className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-white dark:text-neutral-900 uppercase tracking-widest italic">SMS Extraction Intelligence Pulse Active</p>
                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold mt-2 italic leading-relaxed">
                            Command Engine: <span className="text-primary underline underline-offset-4 decoration-2">sms-intel-v1</span> · 
                            Status: monitoring inbound institutional banking nodes 24/7
                        </p>
                    </div>
                </div>
            </div>

            <ExpenseForm
                isOpen={isExpenseFormOpen}
                onClose={() => setIsExpenseFormOpen(false)}
                onSave={handleCreateManualExpense}
            />
        </Layout>
    );
};

export default SmsTrackerPage;
