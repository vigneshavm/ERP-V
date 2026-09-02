import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { fetchJournalEntries } from '../../../redux/slices/journalEntrySlice';
import Layout from '../../../components/shared/Layout/Layout';
import PageHeader from '../../../components/shared/Layout/PageHeader';
import { Plus, Search, Filter, Calendar as CalendarIcon, FileText, ChevronRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const JournalEntries: React.FC = () => {
    const dispatch = useDispatch<any>();
    const navigate = useNavigate();
    const { entries, loading } = useSelector((state: RootState) => state.journalEntry);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        dispatch(fetchJournalEntries());
    }, [dispatch]);

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
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="General Journal"
                    description="Institutional transaction ledger and fiscal adjustments."
                    breadcrumbs={[
                        { label: 'Home', link: '/dashboard' },
                        { label: 'Finance', link: '/finance' },
                        { label: 'Journal' }
                    ]}
                    actions={
                        <div className="flex gap-3">
                            <button className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-neutral-50 shadow-sm transition active:scale-95 uppercase tracking-widest">
                                <Download className="w-4 h-4" /> Export Ledger
                            </button>
                            <button
                                onClick={() => navigate('/finance/journal/new')}
                                className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 uppercase tracking-widest"
                            >
                                <Plus className="w-4 h-4" /> New Entry
                            </button>
                        </div>
                    }
                />

                {/* Search & Stats Pulse */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-neutral-800 p-4 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search by description or reference code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-sm focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <button className="p-3 bg-neutral-50 dark:bg-neutral-900 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 rounded-sm text-neutral-500 transition shadow-sm">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Ledger Container */}
                <div className="bg-white dark:bg-neutral-800 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-800">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Fiscal Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Reference ID</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Narration</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] text-right">Debit (INR)</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] text-right">Credit (INR)</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] text-center">Status</th>
                                    <th className="px-8 py-5"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {loading && entries.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Synchronizing Ledger...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredEntries.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-40">
                                                <FileText className="w-12 h-12" />
                                                <p className="text-sm font-bold uppercase tracking-widest">No matching records found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEntries.map((entry) => {
                                        const totalAmount = entry.entries.reduce((sum, e) => sum + e.debit, 0);
                                        return (
                                            <tr key={entry._id} className="group hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-all cursor-default">
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <CalendarIcon className="w-4 h-4 text-neutral-300" />
                                                        <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400">{formatDate(entry.date)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white font-mono tracking-tighter uppercase">{entry.reference}</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-bold text-neutral-600 dark:text-neutral-400 max-w-xs truncate italic">"{entry.description}"</p>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white tabular-nums">{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                                    <span className="text-xs font-black text-neutral-900 dark:text-white tabular-nums">{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${entry.status === 'POSTED'
                                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-success'
                                                        : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-warning'
                                                        }`}>
                                                        {entry.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                                    <button className="p-2 text-neutral-300 hover:text-primary transition-all group-hover:translate-x-1">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default JournalEntries;
