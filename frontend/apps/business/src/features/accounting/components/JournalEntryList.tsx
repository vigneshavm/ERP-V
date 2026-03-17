import React, { useState } from 'react';
import { Search, Filter, Plus, Calendar as CalendarIcon, FileText, ChevronRight } from 'lucide-react';
import { Button } from "@repo/ui";
import { useJournalEntries } from '@repo/shared';
import { JournalEntry } from '@repo/shared/adapters/types';

interface JournalEntryListProps {
    onNewEntry: () => void;
}

const JournalEntryList: React.FC<JournalEntryListProps> = ({ onNewEntry }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const { entries, loading, error, refresh } = useJournalEntries();

    const filteredEntries = entries.filter(entry => 
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="flex flex-col space-y-6">
            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
                <div className="flex-1 w-full md:w-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search by description or reference..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="secondary" className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                    </Button>
                    <Button onClick={onNewEntry} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4" />
                        <span>New Entry</span>
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                {loading && entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                        <p>Loading entries...</p>
                    </div>
                ) : filteredEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
                        <FileText className="w-12 h-12 mb-4 opacity-50" />
                        <p>No journal entries found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                                <tr className="text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Reference</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Debit</th>
                                    <th className="px-6 py-4 text-right">Credit</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                {filteredEntries.map((entry) => {
                                    const totalAmount = entry.entries.reduce((sum, e) => sum + e.debit, 0);
                                    return (
                                        <tr key={entry.id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                                                <div className="flex items-center gap-2">
                                                    <CalendarIcon className="w-4 h-4 text-neutral-400" />
                                                    {formatDate(entry.date)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white font-mono">
                                                {entry.reference}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300 max-w-xs truncate">
                                                {entry.description}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-neutral-900 dark:text-white">
                                                {totalAmount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-neutral-900 dark:text-white">
                                                {totalAmount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entry.status === 'POSTED'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                    }`}>
                                                    {entry.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button className="text-neutral-400 hover:text-indigo-600 transition-colors">
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JournalEntryList;
