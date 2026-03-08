import React, { useState } from 'react';
import { Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { Button } from "@repo/ui";

interface JournalLine {
    id: string;
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
}

interface JournalEntryFormProps {
    onCancel: () => void;
    onPost: (data: any) => void;
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ onCancel, onPost }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');
    const [description, setDescription] = useState('');
    const [lines, setLines] = useState<JournalLine[]>([
        { id: Math.random().toString(36).substr(2, 9), accountId: '', accountName: '', debit: 0, credit: 0 },
        { id: Math.random().toString(36).substr(2, 9), accountId: '', accountName: '', debit: 0, credit: 0 }
    ]);
    const [loading, setLoading] = useState(false);

    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;
    const difference = Math.abs(totalDebit - totalCredit);

    const handleAddLine = () => {
        setLines([...lines, { id: Math.random().toString(36).substr(2, 9), accountId: '', accountName: '', debit: 0, credit: 0 }]);
    };

    const handleRemoveLine = (id: string) => {
        if (lines.length > 2) {
            setLines(lines.filter(line => line.id !== id));
        }
    };

    const handleLineChange = (id: string, field: keyof JournalLine, value: string) => {
        setLines(lines.map(line => {
            if (line.id === id) {
                if (field === 'debit' || field === 'credit') {
                    return { ...line, [field]: parseFloat(value) || 0 };
                }
                return { ...line, [field]: value };
            }
            return line;
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalanced) return;
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            onPost({ date, reference, description, lines });
            setLoading(false);
        }, 1000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Reference #</label>
                        <input
                            type="text"
                            placeholder="JV/2026/000"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Description</label>
                        <input
                            type="text"
                            placeholder="Enter description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                            required
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <div className="grid grid-cols-12 gap-4 mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                        <div className="col-span-3">Account Code</div>
                        <div className="col-span-3">Account Name</div>
                        <div className="col-span-2 text-right">Debit</div>
                        <div className="col-span-2 text-right">Credit</div>
                        <div className="col-span-2"></div>
                    </div>

                    <div className="space-y-3">
                        {lines.map((line) => (
                            <div key={line.id} className="grid grid-cols-12 gap-4 items-center group">
                                <div className="col-span-3">
                                    <input
                                        type="text"
                                        placeholder="Acc-001"
                                        value={line.accountId}
                                        onChange={(e) => handleLineChange(line.id, 'accountId', e.target.value)}
                                        className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="col-span-3">
                                    <input
                                        type="text"
                                        placeholder="Select Account"
                                        value={line.accountName}
                                        onChange={(e) => handleLineChange(line.id, 'accountName', e.target.value)}
                                        className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={line.debit || ''}
                                        onChange={(e) => handleLineChange(line.id, 'debit', e.target.value)}
                                        className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-none rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={line.credit || ''}
                                        onChange={(e) => handleLineChange(line.id, 'credit', e.target.value)}
                                        className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-none rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="col-span-2 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLine(line.id)}
                                        disabled={lines.length <= 2}
                                        className="p-2 text-neutral-400 hover:text-red-500 disabled:opacity-30"
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
                        className="mt-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Line Item
                    </button>
                </div>
            </div>

            {/* Totals */}
            <div className={`p-6 rounded-2xl border ${isBalanced ? 'bg-white border-neutral-200' : 'bg-red-50 border-red-200'} dark:bg-neutral-800 dark:border-neutral-700 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm`}>
                <div className="flex items-center gap-3">
                    {!isBalanced && <AlertCircle className="w-6 h-6 text-red-500" />}
                    <div>
                        <p className={`text-sm font-black uppercase tracking-widest ${isBalanced ? 'text-neutral-500' : 'text-red-500'}`}>
                            {isBalanced ? 'Balanced' : 'Unbalanced Entry'}
                        </p>
                        {!isBalanced && (
                            <p className="text-xs text-red-500 font-mono">Difference: ₹{difference.toFixed(2)}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Total Debit</p>
                        <p className="text-2xl font-black font-mono">₹{totalDebit.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Total Credit</p>
                        <p className="text-2xl font-black font-mono">₹{totalCredit.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8" 
                    disabled={!isBalanced || loading}
                >
                    {loading ? 'Posting...' : 'Post Entry'}
                    {!loading && <Save className="w-4 h-4 ml-2" />}
                </Button>
            </div>
        </form>
    );
};

export default JournalEntryForm;
