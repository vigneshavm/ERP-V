import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/shared/Layout/Layout';
import PageHeader from '../../../components/shared/Layout/PageHeader';
import { ArrowLeft, Save, Plus, Trash2, AlertCircle, Info } from 'lucide-react';
import { RootState } from '../../../redux/store';
import { createJournalEntry } from '../../../redux/slices/journalEntrySlice';
import { toast } from 'react-toastify';
import { Button, Input } from '@/components/shared';

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
                        <Button variant="secondary" size="md" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/finance/journal')}>
                            Discard
                        </Button>
                    }
                />

                <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-8">
                    {/* Primary Meta Data */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="md:col-span-1">
                            <Input
                                label="Fiscal Date"
                                type="date"
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <Input
                                label="Reference ID"
                                type="text"
                                required
                                placeholder="e.g., ADJ-0224-01"
                                value={reference}
                                onChange={e => setReference(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Input
                                label="Transaction Narration"
                                type="text"
                                required
                                placeholder="Describe the adjustment or entry..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Transaction Ledger Table */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Transaction Ledger</h3>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase italic">
                                <Info className="w-3.5 h-3.5" /> Use unique account codes
                            </div>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Column Headers */}
                            <div className="hidden md:grid grid-cols-12 gap-6 px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <div className="col-span-3">Account Code</div>
                                <div className="col-span-3">Description</div>
                                <div className="col-span-2 text-right">Debit (INR)</div>
                                <div className="col-span-2 text-right">Credit (INR)</div>
                                <div className="col-span-2"></div>
                            </div>

                            <div className="space-y-3">
                                {lineItems.map((item) => (
                                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-sm border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all">
                                        <div className="col-span-12 md:col-span-3">
                                            <input
                                                type="text"
                                                placeholder="CODE-001"
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold tracking-tight uppercase focus:ring-2 focus:ring-primary/20"
                                                value={item.accountId}
                                                onChange={e => handleLineChange(item.id, 'accountId', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <input
                                                type="text"
                                                placeholder="Account Name"
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20"
                                                value={item.accountName}
                                                onChange={e => handleLineChange(item.id, 'accountName', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="w-full px-4 py-2.5 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-success dark:text-success focus:ring-2 focus:ring-primary/20"
                                                value={item.debit || ''}
                                                onChange={e => handleLineChange(item.id, 'debit', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                className="w-full px-4 py-2.5 text-right bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-danger dark:text-danger focus:ring-2 focus:ring-primary/20"
                                                value={item.credit || ''}
                                                onChange={e => handleLineChange(item.id, 'credit', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-12 md:col-span-2 flex justify-end">
                                            <Button
                                                type="button"
                                                variant="tertiary"
                                                size="sm"
                                                icon={<Trash2 className="w-4 h-4" />}
                                                onClick={() => handleRemoveLine(item.id)}
                                                className="hover:text-danger hover:bg-danger-soft"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button
                                type="button"
                                variant="tertiary"
                                size="md"
                                icon={<Plus className="w-3.5 h-3.5" />}
                                onClick={handleAddLine}
                                className="px-4 py-4"
                            >
                                Add line
                            </Button>
                        </div>
                    </div>

                    {/* Finalization Controller */}
                    <div className={`p-8 rounded-xl border shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 transition-all duration-500 ${isBalanced ? 'bg-slate-900 text-white border-slate-800' : 'bg-danger-soft dark:bg-danger-soft border-danger-line dark:border-danger/30 ring-4 ring-rose-500/10'}`}>
                        <div className="flex items-center gap-4">
                            {!isBalanced ? (
                                <div className="w-12 h-12 bg-danger/20 rounded-sm flex items-center justify-center text-danger animate-pulse">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-success/20 rounded-sm flex items-center justify-center text-success">
                                    <Save className="w-6 h-6" />
                                </div>
                            )}
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isBalanced ? 'text-slate-400' : 'text-danger'}`}>
                                    {isBalanced ? 'Institutional Balance Confirmed' : 'Ledger Imbalance Detected'}
                                </p>
                                <p className={`text-sm font-bold mt-1 ${isBalanced ? 'text-white' : 'text-danger dark:text-danger italic'}`}>
                                    {isBalanced ? 'Ready for immutable ledger commitment.' : `Variance detected: ₹${Math.abs(difference).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-12">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Debits</p>
                                <p className="text-2xl font-black font-mono tracking-tighter tabular-nums text-success">₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Credits</p>
                                <p className="text-2xl font-black font-mono tracking-tighter tabular-nums text-danger">₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                            </div>
                        </div>

                        <div className="shrink-0">
                            <Button
                                type="submit"
                                variant={isBalanced ? 'primary' : 'secondary'}
                                size="lg"
                                disabled={loading || !isBalanced}
                                loading={loading}
                                icon={<Save className="w-4 h-4" />}
                            >
                                Commit Transaction
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default JournalEntryForm;
