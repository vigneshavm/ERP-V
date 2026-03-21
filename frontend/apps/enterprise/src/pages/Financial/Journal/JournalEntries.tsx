import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from "@/app/store/store";
import { fetchJournalEntries, clearCurrentEntry } from "@/entities/finance/model/journalEntrySlice";
import Layout from "@/shared/ui/Layout";
import { Plus, Search, Filter, Calendar as CalendarIcon, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from "@/shared/ui/Layout/PageHeader";

const JournalEntries: React.FC = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const { entries, loading, error } = useSelector((state: RootState) => state.journalEntry);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        dispatch(fetchJournalEntries());
    }, [dispatch]);

    // Filtering logic (client-side for now, can be server-side if updated fetch accepts params)
    const filteredEntries = entries.filter(entry => {
        const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.reference.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <Layout>
            <div className="page-shell">
            <div className="flex flex-col h-full bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]">
                <Header title="Journal Entries" />

                <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 space-y-6">
                    {/* Actions Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[var(--erp-card)] p-4 rounded-xl shadow-sm border border-default dark:border-default">
                        <div className="flex-1 w-full md:w-auto relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search by description or reference..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            {/* Date Filter placeholder */}
                            <button className="flex items-center gap-2 px-4 py-2 bg-[var(--erp-bg-sunken)] dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium">
                                <Filter className="w-4 h-4" />
                                <span>Filter</span>
                            </button>
                            <button
                                onClick={() => navigate('/finance/journal/new')}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New Entry</span>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto bg-white dark:bg-[var(--erp-card)] rounded-2xl border border-default dark:border-default shadow-sm">
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
                            <table className="w-full">
                                <thead className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 sticky top-0 z-10">
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
                                            <tr key={entry._id} className="group hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-300">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarIcon className="w-4 h-4 text-neutral-400" />
                                                        {formatDate(entry.date)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-main font-mono">
                                                    {entry.reference}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300 max-w-xs truncate">
                                                    {entry.description}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-neutral-900 dark:text-main">
                                                    {totalAmount.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-neutral-900 dark:text-main">
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
                                                    <button className="text-neutral-400 hover:text-primary transition-colors">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
                  </div>

        </Layout>
    );
};

export default JournalEntries;
