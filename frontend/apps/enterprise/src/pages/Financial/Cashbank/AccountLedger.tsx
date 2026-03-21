import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Layout from "@/shared/ui/Layout";
import PageHeader from "@/shared/ui/Layout/PageHeader";
import CashBankStatsCard from './components/CashBankStatsCard';
import {
    getAccountLedger,
    toggleReconciliation,
    bulkReconcile as bulkReconcileThunk,
    reset
} from "@/entities/finance/model/cashbankSlice";
import { RootState, AppDispatch } from "@/app/store/store";
import { LedgerData, Transaction } from './types';
import { ArrowLeft, Download, RefreshCw, CheckCircle2, X } from 'lucide-react';

const AccountLedger: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { ledgerData, isLoading: loading } = useSelector((state: RootState) => state.cashbank);

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        reconciled: 'all'
    });
    const [selectedTxns, setSelectedTxns] = useState<string[]>([]);

    useEffect(() => {
        if (id) {
            dispatch(getAccountLedger({ id, filters }));
        }
    }, [id, filters, dispatch]);

    const toggleReconcile = (txnId: string) => {
        dispatch(toggleReconciliation(txnId));
    };

    const bulkReconcile = async (reconciled: boolean) => {
        if (selectedTxns.length === 0) {
            toast.warning('Please select transactions first');
            return;
        }
        dispatch(bulkReconcileThunk({ transactionIds: selectedTxns, reconciled }))
            .then(() => {
                setSelectedTxns([]);
                if (id) {
                    dispatch(getAccountLedger({ id, filters }));
                }
            });
    };


    const toggleSelectTxn = (txnId: string) => {
        setSelectedTxns(prev =>
            prev.includes(txnId) ? prev.filter(tid => tid !== txnId) : [...prev, txnId]
        );
    };

    const selectAll = () => {
        if (ledgerData && selectedTxns.length === ledgerData.ledger.length) {
            setSelectedTxns([]);
        } else if (ledgerData) {
            setSelectedTxns(ledgerData.ledger.map(t => t._id));
        }
    };

    const exportCSV = () => {
        window.open(
            `/api/cashbank/export?accountId=${id}&format=csv&startDate=${filters.startDate}&endDate=${filters.endDate}`,
            '_blank'
        );
    };

    if (loading) {
        return (
            <Layout>
                <div className="page-shell">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
                      </div>

            </Layout>
        );
    }

    if (!ledgerData) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-muted">Account not found</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageHeader
                title={`${ledgerData.account.bankName} - Ledger`}
                description={ledgerData.account._id === 'cash'
                    ? `Account: Cash | Type: ${ledgerData.account.accountType}`
                    : `Account: ****${ledgerData.account.accountNumber.slice(-4)} | Type: ${ledgerData.account.accountType}`}
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate('/cashbank/summary')}
                            className="px-4 py-2 border border-default dark:border-default rounded-xl hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-card)] text-secondary dark:text-muted text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <button
                            onClick={exportCSV}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 dark:shadow-none flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                    </div>
                }
            />

            {/* Account Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <CashBankStatsCard
                    title="Opening Balance"
                    amount={ledgerData.summary.openingBalance}
                    colorClass="text-main"
                    icon={RefreshCw}
                />
                <CashBankStatsCard
                    title="Total Credits"
                    amount={ledgerData.summary.totalCredits}
                    colorClass="text-emerald-600"
                    icon={CheckCircle2}
                />
                <CashBankStatsCard
                    title="Total Debits"
                    amount={ledgerData.summary.totalDebits}
                    colorClass="text-rose-600"
                    icon={X}
                />
                <CashBankStatsCard
                    title="Closing Balance"
                    amount={ledgerData.summary.closingBalance}
                    colorClass="text-indigo-600"
                    icon={RefreshCw}
                />
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-[var(--erp-bg)] border border-default dark:border-default rounded-[2.5rem] p-8 mb-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border border-default dark:border-default rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border border-default dark:border-default rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Status</label>
                        <select
                            value={filters.reconciled}
                            onChange={(e) => setFilters({ ...filters, reconciled: e.target.value })}
                            className="w-full px-4 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border border-default dark:border-default rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm"
                        >
                            <option value="all">All Transactions</option>
                            <option value="true">Reconciled Only</option>
                            <option value="false">Unreconciled Only</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => setFilters({ startDate: '', endDate: '', reconciled: 'all' })}
                            className="w-full py-3 border border-default dark:border-default text-muted rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-card)] transition-all"
                        >
                            Clear Parameters
                        </button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedTxns.length > 0 && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-[2rem] p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in">
                    <span className="text-indigo-800 dark:text-indigo-300 font-black uppercase tracking-tight text-sm">{selectedTxns.length} transaction(s) targeted</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => bulkReconcile(true)}
                            className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 dark:shadow-none hover:bg-emerald-700 transition-all"
                        >
                            Mark Reconciled
                        </button>
                        <button
                            onClick={() => bulkReconcile(false)}
                            className="px-6 py-2.5 bg-slate-600 text-main rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-slate-700 transition-all"
                        >
                            Mark Unreconciled
                        </button>
                        <button
                            onClick={() => setSelectedTxns([])}
                            className="px-6 py-2.5 border border-indigo-200 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                        >
                            Clear Selection
                        </button>
                    </div>
                </div>
            )}

            {/* Ledger Table */}
            <div className="bg-white dark:bg-[var(--erp-bg)] border border-default dark:border-default rounded-[2.5rem] shadow-sm overflow-hidden mb-20">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-b border-default dark:border-default">
                                <th className="px-6 py-4 text-left w-10">
                                    <input
                                        type="checkbox"
                                        checked={ledgerData.ledger.length > 0 && selectedTxns.length === ledgerData.ledger.length}
                                        onChange={selectAll}
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-muted uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-muted uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-muted uppercase tracking-widest">Debit</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-muted uppercase tracking-widest">Credit</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-muted uppercase tracking-widest">Balance</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-muted uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-muted uppercase tracking-widest">Execution</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {ledgerData.ledger.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center flex flex-col items-center">
                                        <div className="w-16 h-16 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] rounded-2xl flex items-center justify-center text-slate-200 mb-4 font-black text-2xl">?</div>
                                        <p className="text-sm font-black text-main uppercase tracking-tight">No Temporal Data Found</p>
                                        <p className="text-xs font-medium text-muted mt-1">Adjust filters to broaden the registry search.</p>
                                    </td>
                                </tr>
                            ) : (
                                ledgerData.ledger.map((txn) => (
                                    <tr key={txn._id} className={`hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-card)]/50 transition-colors ${txn.reconciled ? 'bg-emerald-50/10' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedTxns.includes(txn._id)}
                                                onChange={() => toggleSelectTxn(txn._id)}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-secondary dark:text-muted">
                                            {new Date(txn.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <p className="text-sm font-black text-main uppercase tracking-tight truncate">{txn.description || 'No Narrative Data'}</p>
                                            {txn.reference && (
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] rounded-md text-[9px] font-black text-muted uppercase tracking-widest">Ref: {txn.reference}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-rose-500">
                                            {(txn.debit || 0) > 0 ? `₹${(txn.debit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-emerald-500">
                                            {(txn.credit || 0) > 0 ? `₹${(txn.credit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-base font-black text-indigo-600">
                                            ₹{(txn.runningBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {txn.reconciled ? (
                                                <span className="px-3 py-1 text-[9px] font-black rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
                                                    Reconciled
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 text-[9px] font-black rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 uppercase tracking-widest border border-amber-200 dark:border-amber-800">
                                                    Unsettled
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => toggleReconcile(txn._id)}
                                                className={`p-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${txn.reconciled ? 'text-muted hover:text-rose-600 hover:bg-rose-50' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                            >
                                                {txn.reconciled ? 'Revoke CLEAR' : 'Execute CLEAR'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default AccountLedger;

