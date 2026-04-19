import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/shared/Layout/Layout';
import PageHeader from '../../../components/shared/Layout/PageHeader';
import { ArrowLeft, Save, Plus, Trash2, AlertCircle, Info } from 'lucide-react';
import { RootState } from '../../../redux/store';
import { createJournalEntry } from '../../../redux/slices/journalEntrySlice';
import { toast } from 'react-toastify';

interface JELineItem {
    id: number;
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
}

const JournalEntryForm: React.FC = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const { loading } = useSelector((state: RootState) => state.journalEntry);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');
    const [description, setDescription] = useState('');
    const [lineItems, setLineItems] = useState<JELineItem[]>([
        { id: 1, accountId: '', accountName: '', debit: 0, credit: 0 },
        { id: 2, accountId: '', accountName: '', debit: 0, credit: 0 }
    ]);

    const totalDebit = lineItems.reduce((sum, item) => sum + (item.debit || 0), 0);
    const totalCredit = lineItems.reduce((sum, item) => sum + (item.credit || 0), 0);
    const difference = totalDebit - totalCredit;
    const isBalanced = Math.abs(difference) < 0.01 && (totalDebit > 0 || totalCredit > 0);

    const handleAddLine = () => {
        setLineItems([...lineItems, {
            id: Date.now(),
            accountId: '',
            accountName: '',
            debit: 0,
            credit: 0
        }]);
    };

    const handleRemoveLine = (id: number) => {
        if (lineItems.length <= 2) {
            toast.error("Journal entry requires at least 2 balanced lines.");
            return;
        }
        setLineItems(lineItems.filter(item => item.id !== id));
    };

    const handleLineChange = (id: number, field: keyof JELineItem, value: any) => {
        setLineItems(lineItems.map(item => {
            if (item.id === id) {
                if (field === 'debit' && Number(value) > 0) return { ...item, [field]: Number(value), credit: 0 };
                if (field === 'credit' && Number(value) > 0) return { ...item, [field]: Number(value), debit: 0 };
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isBalanced) {
            toast.error(`Ledger imbalance detected. Variance: ₹${Math.abs(difference).toFixed(2)}`);
            return;
        }

        if (lineItems.some(i => !i.accountId || !i.accountName)) {
            toast.error("All line items must have a valid account code and name.");
            return;
        }

        const payload = {
            date,
            reference,
            description,
            entries: lineItems.map(item => ({
                accountId: item.accountId,
                accountName: item.accountName,
                debit: Number(item.debit),
                credit: Number(item.credit)
            }))
        };

        try {
            await dispatch(createJournalEntry(payload)).unwrap();
            toast.success("Journal transaction posted successfully.");
            navigate('/finance/journal');
        } catch (err: any) {
            toast.error(err || "Failed to post ledger entry.");
        }
    };

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="Ledger Entry Creation"
                    description="Manual adjustment or institutional transaction recording."
                    breadcrumbs={[
                        { label: 'General Journal', link: '/finance/journal' },
                        { label: 'New Transaction' }
                    ]}
                    actions={
                        <button
                            onClick={() => navigate('/finance/journal')}
                            className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95 uppercase tracking-widest"
                        >
                            <ArrowLeft className="w-4 h-4" /> Discard
                        </button>
                    }
                />

                <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-8">
                    {/* Primary Meta Data */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white dark:bg-neutral-800 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Fiscal Date</label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 font-bold transition-all"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Reference ID</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g., ADJ-0224-01"
                                value={reference}
                                onChange={e => setReference(e.target.value)}
                                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 font-mono font-bold tracking-tighter uppercase transition-all"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Transaction Narration</label>
                            <input
                                type="text"
                                required
                                placeholder="Describe the adjustment or entry..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 font-bold italic transition-all"
                            />
                        </div>
                    </div>

                    {/* Transaction Ledger Table */}
                    <div className="bg-white dark:bg-neutral-800 rounded-[3rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                            <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-[0.2em]">Transaction Ledger</h3>
                            <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase italic">
                                <Info className="w-3.5 h-3.5" /> Use unique account codes
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Column Headers */}
                            <div className="hidden md:grid grid-cols-12 gap-6 px-4 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                                <div className="col-span-3">Account Code</div>
                                <div className="col-span-3">Entity Description</div>
                                <div className="col-span-2 text-right">Debit (INR)</div>
                                <div className="col-span-2 text-right">Credit (INR)</div>
                                <div className="col-span-2"></div>
                            </div>

                            <div className="space-y-3">
                                {lineItems.map((item) => (
                                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-neutral-50/50 dark:bg-neutral-900/30 p-4 rounded-3xl border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800 transition-all">
                                        <div className="col-span-12 md:col-span-3">
                                            <input
                                                type="text"
                                                placeholder="CODE-001"
                                                className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold tracking-tight uppercase focus:ring-2 focus:ring-primary/20"
                                                value={item.accountId}
                                                onChange={e => handleLineChange(item.id, 'accountId', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <input
                                                type="text"
                                                placeholder="Account Name"
                                                className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20"
                                                value={item.accountName}
                                                onChange={e => handleLineChange(item.id, 'accountName', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="w-full px-4 py-2.5 text-right bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-primary/20"
                                                value={item.debit || ''}
                                                onChange={e => handleLineChange(item.id, 'debit', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="w-full px-4 py-2.5 text-right bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-primary/20"
                                                value={item.credit || ''}
                                                onChange={e => handleLineChange(item.id, 'credit', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-12 md:col-span-2 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveLine(item.id)}
                                                className="p-2.5 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleAddLine}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark p-4 group transition-all"
                            >
                                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20">
                                    <Plus className="w-3.5 h-3.5" />
                                </div>
                                Append Ledger Node
                            </button>
                        </div>
                    </div>

                    {/* Finalization Controller */}
                    <div className={`p-8 rounded-[3rem] border shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 transition-all duration-500 ${isBalanced ? 'bg-neutral-900 text-white border-neutral-800' : 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30 ring-4 ring-rose-500/10'}`}>
                        <div className="flex items-center gap-4">
                            {!isBalanced ? (
                                <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 animate-pulse">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                                    <Save className="w-6 h-6" />
                                </div>
                            )}
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isBalanced ? 'text-neutral-400' : 'text-rose-500'}`}>
                                    {isBalanced ? 'Institutional Balance Confirmed' : 'Ledger Imbalance Detected'}
                                </p>
                                <p className={`text-sm font-bold mt-1 ${isBalanced ? 'text-white' : 'text-rose-700 dark:text-rose-400 italic'}`}>
                                    {isBalanced ? 'Ready for immutable ledger commitment.' : `Variance detected: ₹${Math.abs(difference).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-12">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Total Debits</p>
                                <p className="text-2xl font-black font-mono tracking-tighter tabular-nums text-emerald-500">₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Total Credits</p>
                                <p className="text-2xl font-black font-mono tracking-tighter tabular-nums text-rose-500">₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        <div className="shrink-0">
                            <button
                                onClick={handleSubmit}
                                disabled={loading || !isBalanced}
                                className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 ${isBalanced ? 'bg-primary text-white hover:bg-primary/90 shadow-primary/20' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}`}
                            >
                                {loading ? 'Committing...' : 'Commit Transaction'}
                                <Save className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default JournalEntryForm;
