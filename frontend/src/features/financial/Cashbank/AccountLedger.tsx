import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Layout from "../../../components/shared/Layout/index";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import CashBankStatsCard from './components/CashBankStatsCard';
import {
    getAccountLedger,
    toggleReconciliation,
    bulkReconcile as bulkReconcileThunk
} from "../../../redux/slices/cashbankSlice";
import { RootState, AppDispatch } from "../../../redux/store";
import { ArrowLeft, Download, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { formatDate } from '../../../utils/helpers';
import { Button, Input, Select } from '@/components/shared';

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
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    if (!ledgerData) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-slate-500">Account not found</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="pt-8 space-y-6 pb-20">
                <PageHeader
                title={`${ledgerData.account.bankName} - Ledger`}
                description={ledgerData.account._id === 'cash'
                    ? `Account: Cash | Type: ${ledgerData.account.accountType}`
                    : `Account: ****${ledgerData.account.accountNumber.slice(-4)} | Type: ${ledgerData.account.accountType}`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" size="md" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/cashbank/summary')}>
                            Back
                        </Button>
                        <Button variant="success" size="md" icon={<Download className="w-4 h-4" />} onClick={exportCSV}>
                            Export CSV
                        </Button>
                    </div>
                }
            />

            {/* Account Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <CashBankStatsCard
                    title="Opening Balance"
                    amount={ledgerData.summary.openingBalance}
                    colorClass="text-slate-900 dark:text-white"
                    icon={RefreshCw}
                />
                <CashBankStatsCard
                    title="Total Credits"
                    amount={ledgerData.summary.totalCredits}
                    colorClass="text-success"
                    icon={CheckCircle2}
                />
                <CashBankStatsCard
                    title="Total Debits"
                    amount={ledgerData.summary.totalDebits}
                    colorClass="text-danger"
                    icon={X}
                />
                <CashBankStatsCard
                    title="Closing Balance"
                    amount={ledgerData.summary.closingBalance}
                    colorClass="text-primary"
                    icon={RefreshCw}
                />
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 mb-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Input
                        label="Start Date"
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    />
                    <Input
                        label="End Date"
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    />
                    <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">Status</label>
                        <Select
                            options={[
                                { value: 'all', label: 'All Transactions' },
                                { value: 'true', label: 'Reconciled Only' },
                                { value: 'false', label: 'Unreconciled Only' },
                            ]}
                            value={filters.reconciled}
                            onChange={(value) => setFilters({ ...filters, reconciled: typeof value === 'string' ? value : value[0] })}
                        />
                    </div>
                    <div className="flex items-end">
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => setFilters({ startDate: '', endDate: '', reconciled: 'all' })}
                            fullWidth
                        >
                            Clear Parameters
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedTxns.length > 0 && (
                <div className="bg-primary-soft dark:bg-primary-soft border border-primary/30 dark:border-primary/30 rounded-[2rem] p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 animate-fade-in">
                    <span className="text-primary dark:text-primary font-black uppercase tracking-tight text-sm">{selectedTxns.length} transaction(s) targeted</span>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="success" size="md" onClick={() => bulkReconcile(true)}>
                            Mark Reconciled
                        </Button>
                        <Button variant="secondary" size="md" onClick={() => bulkReconcile(false)}>
                            Mark Unreconciled
                        </Button>
                        <Button variant="outline" size="md" onClick={() => setSelectedTxns([])}>
                            Clear Selection
                        </Button>
                    </div>
                </div>
            )}

            {/* Ledger Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden mb-20">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-left w-10">
                                    <input
                                        type="checkbox"
                                        checked={ledgerData.ledger.length > 0 && selectedTxns.length === ledgerData.ledger.length}
                                        onChange={selectAll}
                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Debit</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Credit</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Execution</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {ledgerData.ledger.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center flex flex-col items-center">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-sm flex items-center justify-center text-slate-200 mb-4 font-black text-2xl">?</div>
                                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">No Temporal Data Found</p>
                                        <p className="text-xs font-medium text-slate-400 mt-1">Adjust filters to broaden the registry search.</p>
                                    </td>
                                </tr>
                            ) : (
                                ledgerData.ledger.map((txn) => (
                                    <tr key={txn._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${txn.reconciled ? 'bg-success/10' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedTxns.includes(txn._id)}
                                                onChange={() => toggleSelectTxn(txn._id)}
                                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-600 dark:text-slate-400">
                                            {formatDate(txn.date)}
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">{txn.description || 'No Narrative Data'}</p>
                                            {txn.reference && (
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Ref: {txn.reference}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-danger">
                                            {(txn.debit || 0) > 0 ? `₹${(txn.debit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-success">
                                            {(txn.credit || 0) > 0 ? `₹${(txn.credit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-base font-black text-primary">
                                            ₹{(txn.runningBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {txn.reconciled ? (
                                                <span className="px-3 py-1 text-[9px] font-black rounded-lg bg-success-soft dark:bg-success-soft text-success uppercase tracking-widest border border-success-line dark:border-success-line">
                                                    Reconciled
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 text-[9px] font-black rounded-lg bg-warning-soft dark:bg-warning-soft text-warning uppercase tracking-widest border border-warning-line dark:border-warning-line">
                                                    Unsettled
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <Button
                                                variant="tertiary"
                                                size="sm"
                                                className={txn.reconciled ? 'text-slate-400 hover:text-danger' : 'text-primary'}
                                                onClick={() => toggleReconcile(txn._id)}
                                            >
                                                {txn.reconciled ? 'Revoke CLEAR' : 'Execute CLEAR'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                </div>
            </div>
        </Layout>
    );
};

export default AccountLedger;

