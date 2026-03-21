import React from 'react';
import { Wallet, IndianRupee } from 'lucide-react';
import { Card } from "@/shared/ui";
import { LaborPayment } from "@/entities/people/model/hr";
import { formatCurrency } from "@/shared/lib/utils/helpers";

interface PaymentHistoryProps {
    payments: LaborPayment[];
    selectedLaborerId: string;
    paymentAmount: string;
    setPaymentAmount: (val: string) => void;
    paymentType: 'SALARY' | 'ADVANCE';
    setPaymentType: (type: 'SALARY' | 'ADVANCE') => void;
    paymentNote: string;
    setPaymentNote: (val: string) => void;
    onAddPayment: () => void;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({
    payments, selectedLaborerId, paymentAmount, setPaymentAmount, paymentType, setPaymentType, paymentNote, setPaymentNote, onAddPayment
}) => {
    const laborerPayments = payments
        .filter(p => p.employeeId === selectedLaborerId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="flex-1 min-w-0">
            <Card className="flex-1 flex flex-col overflow-hidden h-full bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-bg)]/30">
                <div className="p-3 border-b border-default dark:border-default bg-white dark:bg-[var(--erp-card)]">
                    <h3 className="font-bold text-secondary dark:text-muted flex items-center gap-2 text-sm">
                        <Wallet size={16} /> Transaction History
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {laborerPayments.length === 0 && (
                        <p className="text-center text-muted text-xs py-8 italic">No payment history found.</p>
                    )}
                    {laborerPayments.map(p => (
                        <div key={p.id} className="bg-white dark:bg-[var(--erp-card)] p-3 rounded-md border border-default dark:border-default shadow-sm flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-1.5 rounded ${p.type === 'SALARY' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}`}>
                                        {p.type}
                                    </span>
                                    <span className="text-xs font-bold text-secondary dark:text-slate-200">{formatCurrency(p.amount)}</span>
                                </div>
                                <p className="text-[10px] text-muted dark:text-muted mt-0.5">
                                    {new Date(p.date).toLocaleDateString()} {p.note && `• ${p.note}`}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-3 bg-white dark:bg-[var(--erp-card)] border-t border-default dark:border-default">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="flex bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] rounded p-0.5">
                            <button onClick={() => setPaymentType('ADVANCE')} className={`flex-1 text-[10px] font-bold rounded py-1 transition ${paymentType === 'ADVANCE' ? 'bg-white dark:bg-slate-700 shadow text-amber-600 dark:text-amber-400' : 'text-muted'}`}>Advance</button>
                            <button onClick={() => setPaymentType('SALARY')} className={`flex-1 text-[10px] font-bold rounded py-1 transition ${paymentType === 'SALARY' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-muted'}`}>Salary</button>
                        </div>
                        <input
                            type="text"
                            placeholder="Note (Optional)"
                            value={paymentNote}
                            onChange={e => setPaymentNote(e.target.value)}
                            className="w-full px-2 py-1 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] border border-default dark:border-slate-600 rounded text-xs outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <IndianRupee className="absolute left-2 top-2 text-muted w-3.5 h-3.5" />
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="Amount"
                                className="w-full pl-7 pr-2 py-1.5 border border-default dark:border-slate-600 bg-white dark:bg-[var(--erp-bg)] dark:text-main rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={onAddPayment}
                            disabled={!paymentAmount}
                            className="bg-[var(--erp-card)] dark:bg-slate-700 text-main px-3 py-1.5 rounded text-sm font-bold hover:bg-[var(--erp-bg)] dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PaymentHistory;
