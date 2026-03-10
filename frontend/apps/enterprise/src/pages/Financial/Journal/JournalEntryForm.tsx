import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/shared/Layout/Layout';
import PageHeader from '../../../components/shared/Layout/PageHeader';
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { RootState } from "@/app/store/store";
import { createJournalEntry } from "@/app/store/slices/journalEntrySlice";
// import { toast } from 'react-hot-toast';

// Temporary Toast Replacement
const toast = {
    success: (msg: string) => alert(`Success: ${msg}`),
    error: (msg: string) => alert(`Error: ${msg}`)
};

interface JELineItem {
    id: number;
    accountId: string; // Initially just string input, later dropdown
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
    const isBalanced = Math.abs(difference) < 0.01;

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
            toast.error("Journal entry needs at least 2 lines");
            return;
        }
        setLineItems(lineItems.filter(item => item.id !== id));
    };

    const handleLineChange = (id: number, field: keyof JELineItem, value: any) => {
        setLineItems(lineItems.map(item => {
            if (item.id === id) {
                // If existing debit value > 0 and user types in credit, clear debit (and vice-versa)
                // Assuming standard behavior where a line is either Dr or Cr
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
            toast.error(`Entry is not balanced. Difference: ${difference.toFixed(2)}`);
            return;
        }

        if (lineItems.some(i => !i.accountId || !i.accountName)) {
            toast.error("Please fill in account details for all lines");
            return;
        }

        const payload = {
            date,
            reference,
            description,
            entries: lineItems.map(item => ({
                accountId: item.accountId, // You might map checking account ID vs name
                accountName: item.accountName,
                debit: Number(item.debit),
                credit: Number(item.credit)
            }))
        };

        try {
            await dispatch(createJournalEntry(payload)).unwrap();
            toast.success("Journal Entry Posted Successfully");
            navigate('/finance/journal');
        } catch (err: any) {
            toast.error(err || "Failed to post entry");
        }
    };

    return (
        <Layout>
            <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900">
                <PageHeader
                    title="New Journal Entry"
                    backButton={
                        <button
                            onClick={() => navigate('/finance/journal')}
                            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-700 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Back to Journal</span>
                        </button>
                    }
                />

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
                    <div className="max-w-5xl mx-auto space-y-6">

                        {/* Header Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Reference #</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., ADJ-2023-001"
                                    value={reference}
                                    onChange={e => setReference(e.target.value)}
                                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Describe the transaction..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Line Items</h3>

                            <div className="space-y-4">
                                {/* Header Row */}
                                <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-semibold text-neutral-500 uppercase px-2">
                                    <div className="col-span-3">Account Code</div>
                                    <div className="col-span-3">Account Name</div>
                                    <div className="col-span-2 text-right">Debit</div>
                                    <div className="col-span-2 text-right">Credit</div>
                                    <div className="col-span-2"></div>
                                </div>

                                {lineItems.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-lg border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-colors">
                                        <div className="col-span-12 md:col-span-3">
                                            <input
                                                type="text"
                                                placeholder="Code"
                                                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border-none rounded-md text-sm ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-primary/20"
                                                value={item.accountId}
                                                onChange={e => handleLineChange(item.id, 'accountId', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <input
                                                type="text"
                                                placeholder="Account Name"
                                                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border-none rounded-md text-sm ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-primary/20"
                                                value={item.accountName}
                                                onChange={e => handleLineChange(item.id, 'accountName', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="w-full pl-3 pr-3 py-2 text-right bg-white dark:bg-neutral-800 border-none rounded-md text-sm ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-primary/20 font-mono"
                                                    value={item.debit || ''}
                                                    onChange={e => handleLineChange(item.id, 'debit', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="w-full pl-3 pr-3 py-2 text-right bg-white dark:bg-neutral-800 border-none rounded-md text-sm ring-1 ring-neutral-200 dark:ring-neutral-700 focus:ring-2 focus:ring-primary/20 font-mono"
                                                    value={item.credit || ''}
                                                    onChange={e => handleLineChange(item.id, 'credit', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-12 md:col-span-2 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveLine(item.id)}
                                                className="p-2 text-neutral-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={handleAddLine}
                                    className="flex items-center gap-2 text-primary hover:text-primary-dark font-medium text-sm px-2 py-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Line Item
                                </button>
                            </div>
                        </div>

                        {/* Totals Footer */}
                        <div className={`p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors ${isBalanced ? 'bg-white dark:bg-neutral-800' : 'bg-red-50 dark:bg-red-900/20 ring-1 ring-red-200 dark:ring-red-800'}`}>
                            <div className="flex items-center gap-3">
                                {!isBalanced && <AlertCircle className="w-6 h-6 text-error" />}
                                <div>
                                    <p className={`text-sm font-medium ${isBalanced ? 'text-neutral-500' : 'text-error'}`}>
                                        {isBalanced ? 'Balanced' : 'Unbalanced Entry'}
                                    </p>
                                    {!isBalanced && (
                                        <p className="text-xs text-error">Difference: {difference.toFixed(2)}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="text-xs text-neutral-500 uppercase font-semibold">Total Debit</p>
                                    <p className="text-xl font-bold font-mono text-neutral-900 dark:text-white">{totalDebit.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-neutral-500 uppercase font-semibold">Total Credit</p>
                                    <p className="text-xl font-bold font-mono text-neutral-900 dark:text-white">{totalCredit.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="bg-white dark:bg-neutral-800 p-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3 sticky bottom-0 z-20">
                    <button
                        type="button"
                        onClick={() => navigate('/finance/journal')}
                        className="px-6 py-2.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !isBalanced}
                        className="flex items-center gap-2 px-8 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Posting...' : 'Post Entry'}
                        <Save className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </Layout>
    );
};

export default JournalEntryForm;
