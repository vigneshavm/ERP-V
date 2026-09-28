import React, { useState, useEffect } from 'react';
import { Calendar, IndianRupee, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from "../../../redux/store";
import { fetchDayEndSummary, saveDayEndReconciliation } from "../../../redux/slices/financeSlice";
import { DayEndSummary } from "../../../types/finance";
import { formatCurrency } from "../../../utils/helpers";
import { Button, Input, Modal, Textarea } from '@/components/shared';

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
        <Modal
            isOpen
            onClose={onClose}
            title="Day End Reconciliation"
            size="lg"
        >
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic flex items-center gap-2 -mt-4 mb-4">
                        <Calendar className="w-4 h-4" /> {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>

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

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 block mb-2">Actual Physical Cash Count</label>
                                    <Input
                                        type="number"
                                        value={physicalCash}
                                        onChange={e => setPhysicalCash(e.target.value)}
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
                            <Textarea
                                label="Reconciliation Notes"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                minRows={2}
                                placeholder="Any discrepancies or notes..."
                            />

                            {saveError && (
                                <div role="alert" className="p-4 rounded-xl flex items-center gap-3 bg-error/10 text-error text-sm font-bold">
                                    <AlertTriangle className="w-5 h-5" /> {saveError}
                                </div>
                            )}

                            {/* Submit */}
                            <Button
                                variant="secondary"
                                size="lg"
                                icon={<CheckCircle2 className="w-5 h-5 text-primary" />}
                                onClick={handleSave}
                                disabled={saving || !physicalCash}
                                loading={saving}
                                fullWidth
                            >
                                Close Day & Save Reconciliation
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-400">
                            Failed to load summary. Please try again.
                        </div>
                    )}
        </Modal>
    );
};

export default DayEndModal;
