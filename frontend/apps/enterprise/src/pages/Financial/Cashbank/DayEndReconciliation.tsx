import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from "@/app/store/store";
import { fetchDayEndSummary, saveDayEndReconciliation } from "@/entities/finance/model/financeSlice";
import Layout from "@/shared/ui/Layout";
import { DollarSign, Save, Calendar, CheckSquare, AlertTriangle, Calculator, FileText, CheckCircle2, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from "@/shared/lib/utils/helpers";
import { toast } from 'react-toastify';

const DayEndReconciliation: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { dayEndSummary, loading } = useSelector((state: RootState) => state.finance);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [physicalCash, setPhysicalCash] = useState<string>('');
    const [clearedCheques, setClearedCheques] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        dispatch(fetchDayEndSummary(date));
    }, [dispatch, date]);

    useEffect(() => {
        if (dayEndSummary) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(TS-FIX): Phase 2/3 fix
            setPhysicalCash('');
            setClearedCheques([]);
        }
    }, [dayEndSummary]);

    const handleCashChange = (val: string) => {
        setPhysicalCash(val);
    };

    const toggleCheque = (id: string) => {
        setClearedCheques(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const calculateVariance = () => {
        if (!dayEndSummary) return 0;
        const physical = parseFloat(physicalCash) || 0;
        return physical - dayEndSummary.expectedCash;
    };

    const variance = calculateVariance();

    const handleSubmit = async () => {
        if (!dayEndSummary) return;

        try {
            await dispatch(saveDayEndReconciliation({
                date,
                openingCash: dayEndSummary.openingCash,
                cashSales: dayEndSummary.cashSales,
                cashExpenses: dayEndSummary.cashExpenses,
                expectedCash: dayEndSummary.expectedCash,
                physicalCash: parseFloat(physicalCash) || 0,
                variance,
                clearedChequeIds: clearedCheques,
                notes
            })).unwrap();
            toast.success('Day End Reconciliation Saved Successfully');
            // Reset or Refresh
            dispatch(fetchDayEndSummary(date));
        } catch (err: any) {
            toast.error(err || 'Failed to save reconciliation');
        }
    };

    return (
        <Layout>
            <div className="space-y-6 animate-fade-in text-neutral-900 dark:text-neutral-100 pb-16">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black flex items-center gap-2 tracking-tight uppercase">
                            <FileText className="w-8 h-8 text-primary" />
                            Day End Reconciliation
                        </h2>
                        <p className="text-sm text-neutral-500 mt-1 font-medium flex items-center gap-2">
                            Daily Close Protocol & Financial Tally
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold shadow-sm"
                            />
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition hover:scale-105 active:scale-95 uppercase tracking-[0.2em] disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 fill-current" /> Save & Close Day
                        </button>
                    </div>
                </div>

                {loading && <div className="text-center py-10"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div></div>}

                {!loading && dayEndSummary && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Cash Tally Section */}
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Calculator className="w-5 h-5 text-neutral-400" /> Cash Tally
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl">
                                        <span className="text-xs font-bold text-neutral-500 uppercase">Opening Cash</span>
                                        <span className="font-mono font-bold">₹{formatCurrency(dayEndSummary.openingCash)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-success/5 rounded-2xl border border-success/10">
                                        <span className="text-xs font-bold text-success uppercase flex items-center gap-2"><TrendingUp size={14} /> Cash Sales</span>
                                        <span className="font-mono font-bold text-success">+ ₹{formatCurrency(dayEndSummary.cashSales)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-error/5 rounded-2xl border border-error/10">
                                        <span className="text-xs font-bold text-error uppercase flex items-center gap-2"><TrendingUp size={14} className="rotate-180" /> Expenses</span>
                                        <span className="font-mono font-bold text-error">- ₹{formatCurrency(dayEndSummary.cashExpenses)}</span>
                                    </div>

                                    <div className="border-t border-dashed border-neutral-200 dark:border-neutral-700 my-4"></div>

                                    <div className="flex justify-between items-center px-4">
                                        <span className="text-sm font-black text-neutral-400 uppercase tracking-widest">Expected System Cash</span>
                                        <span className="text-xl font-black font-mono">₹{formatCurrency(dayEndSummary.expectedCash)}</span>
                                    </div>

                                    <div className="pt-6">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">Physical Cash Count</label>
                                        <div className="relative mt-2">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
                                            <input
                                                type="number"
                                                value={physicalCash}
                                                onChange={(e) => handleCashChange(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-xl font-black outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {variance !== 0 && (
                                        <div className={`p-4 rounded-xl flex items-center gap-3 ${variance < 0 ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                                            <AlertCircle size={20} />
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest">Variance Detected</p>
                                                <p className="font-mono font-bold text-lg">
                                                    {variance > 0 ? '+' : ''}₹{formatCurrency(variance)}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] pl-1">Notes / Remarks</label>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="w-full mt-2 p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-primary/10 resize-none h-24"
                                            placeholder="Any discrepancies or notes..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Supplier Alerts */}
                            <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-warning">
                                    <AlertTriangle className="w-5 h-5" /> Supplier Limit Alerts
                                </h3>
                                {dayEndSummary.supplierAlerts.length === 0 ? (
                                    <div className="text-center py-8 text-neutral-400 italic">No supplier limit alerts.</div>
                                ) : (
                                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {dayEndSummary.supplierAlerts.map(alert => (
                                            <div key={alert.supplierId} className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-sm">{alert.businessName}</p>
                                                    <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                                                        Limit: ₹{formatCurrency(alert.creditLimit)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-mono font-bold text-error">₹{formatCurrency(alert.balance)}</p>
                                                    <p className="text-[10px] font-black text-error/80">{alert.percentage.toFixed(1)}% Used</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Cheque Register */}
                            <div className="bg-white dark:bg-neutral-800 p-6 rounded-[2rem] border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-primary">
                                    <CheckSquare className="w-5 h-5" /> Pending Cheques
                                </h3>
                                {dayEndSummary.pendingCheques.length === 0 ? (
                                    <div className="text-center py-8 text-neutral-400 italic">No pending cheques for today.</div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-neutral-500 mb-2">Select cheques that have been presented/cleared today:</p>
                                        <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                            {dayEndSummary.pendingCheques.map(cheque => (
                                                <div
                                                    key={cheque.id || cheque._id}
                                                    onClick={() => toggleCheque(cheque.id || cheque._id || '')}
                                                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${clearedCheques.includes(cheque.id || cheque._id || '')
                                                            ? 'border-success bg-success/5'
                                                            : 'border-transparent bg-neutral-50 dark:bg-neutral-900 hover:border-neutral-200'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${clearedCheques.includes(cheque.id || cheque._id || '')
                                                            ? 'border-success bg-success text-white'
                                                            : 'border-neutral-300 text-transparent'
                                                        }`}>
                                                        <CheckCircle2 size={14} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between">
                                                            <p className="font-bold text-sm">{cheque.payee}</p>
                                                            <p className="font-mono font-bold">₹{formatCurrency(cheque.amount)}</p>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] text-neutral-500 uppercase tracking-widest mt-1">
                                                            <span>#{cheque.number}</span>
                                                            <span>{cheque.bankName}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default DayEndReconciliation;
