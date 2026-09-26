import React, { useState, useEffect } from 'react';
import { X, Calendar, IndianRupee, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from "../../../redux/store";
import { fetchDayEndSummary, saveDayEndReconciliation } from "../../../redux/slices/financeSlice";
import { DayEndSummary } from "../../../types/finance";
import { formatCurrency } from "../../../utils/helpers";

interface DayEndModalProps {
    onClose: () => void;
}

const DayEndModal: React.FC<DayEndModalProps> = ({ onClose }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [loading, setLoading] = useState(true);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [summary, setSummary] = useState<DayEndSummary | null>(null);
    const [physicalCash, setPhysicalCash] = useState('');
    const [variance, setVariance] = useState(0);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        dispatch(fetchDayEndSummary(undefined)).unwrap()
            .then(setSummary)
            .catch((error) => console.error('Failed to fetch day end summary:', error))
            .finally(() => setLoading(false));
    }, [dispatch]);

    useEffect(() => {
        if (summary && physicalCash) {
            setVariance(parseFloat(physicalCash) - summary.expectedCash);
        }
    }, [physicalCash, summary]);

    const handleSave = async () => {
        if (!summary) return;
        setSaving(true);
        setSaveError(null);
        try {
            await dispatch(saveDayEndReconciliation({
                date: new Date().toISOString(),
                openingCash: summary.openingCash,
                cashSales: summary.cashSales,
                cashExpenses: summary.cashExpenses,
                expectedCash: summary.expectedCash,
                physicalCash: parseFloat(physicalCash) || 0,
                variance,
                notes
            })).unwrap();
            onClose();
        } catch (error) {
            // Keep the modal open with the reason; closing silently made a failed save look successful.
            setSaveError(typeof error === 'string' ? error : 'Failed to save day end reconciliation');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative">
                <div className="p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-1">Day End Reconciliation</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-slate-100 dark:bg-slate-900 rounded-full text-slate-400 hover:text-error transition">
                            <X size={20} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : summary ? (
                        <div className="space-y-8">
                            {/* Cash Flow Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-success/10 rounded-[2rem] border border-success/20">
                                    <p className="text-[9px] font-black text-success uppercase tracking-widest mb-1">Cash Sales (In)</p>
                                    <p className="text-2xl font-black italic text-success">{formatCurrency(summary.cashSales)}</p>
                                </div>
                                <div className="p-6 bg-error/10 rounded-[2rem] border border-error/20">
                                    <p className="text-[9px] font-black text-error uppercase tracking-widest mb-1">Cash Expenses (Out)</p>
                                    <p className="text-2xl font-black italic text-error">{formatCurrency(summary.cashExpenses)}</p>
                                </div>
                            </div>

                            {/* Expected vs Physical */}
                            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Expected Cash in Drawer</p>
                                        <p className="text-3xl font-black italic text-primary">{formatCurrency(summary.expectedCash)}</p>
                                    </div>
                                    <IndianRupee className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Actual Physical Cash Count</label>
                                    <input
                                        type="number"
                                        value={physicalCash}
                                        onChange={e => setPhysicalCash(e.target.value)}
                                        className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm text-xl font-black italic outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                                        placeholder="Enter counted cash..."
                                    />
                                </div>

                                {physicalCash && (
                                    <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${variance >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                                        {variance >= 0 ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                        <span className="text-sm font-black uppercase tracking-widest">
                                            Variance: {formatCurrency(Math.abs(variance))} {variance >= 0 ? 'Surplus' : 'Shortage'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Pending Cheques */}
                            {summary.pendingCheques.length > 0 && (
                                <div className="p-6 bg-warning/10 rounded-[2rem] border border-warning/20">
                                    <p className="text-[9px] font-black text-warning uppercase tracking-widest mb-3">Cheques Pending Clearance Today</p>
                                    <div className="space-y-2">
                                        {summary.pendingCheques.map((chq, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs font-bold text-warning">
                                                <span>{chq.payee || chq.number}</span>
                                                <span>{formatCurrency(chq.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Reconciliation Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={2}
                                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-sm text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                                    placeholder="Any discrepancies or notes..."
                                />
                            </div>

                            {saveError && (
                                <div role="alert" className="p-4 rounded-xl flex items-center gap-3 bg-error/10 text-error text-sm font-bold">
                                    <AlertTriangle className="w-5 h-5" /> {saveError}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                onClick={handleSave}
                                disabled={saving || !physicalCash}
                                className="w-full py-5 bg-slate-950 text-white rounded-sm text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-900 transition-all flex items-center justify-center gap-4 border border-slate-700 disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-5 h-5 text-primary" />
                                {saving ? 'Saving...' : 'Close Day & Save Reconciliation'}
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-400">
                            Failed to load summary. Please try again.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DayEndModal;
