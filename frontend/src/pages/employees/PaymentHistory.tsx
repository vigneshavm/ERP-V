import React from 'react';
import { Wallet, IndianRupee } from 'lucide-react';
import { Card } from '../../../../src/components/Card';
import { LaborPayment } from '../../../../src/types/hr';
import { formatCurrency } from '../../../../src/utils/helpers';

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
            <Card className="flex-1 flex flex-col overflow-hidden h-full bg-slate-50/50 dark:bg-slate-900/30">
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 text-sm">
                        <Wallet size={16} /> Transaction History
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {laborerPayments.length === 0 && (
                        <p className="text-center text-slate-400 text-xs py-8 italic">No payment history found.</p>
                    )}
                    {laborerPayments.map(p => (
                        <div key={p.id} className="bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-1.5 rounded ${p.type === 'SALARY' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}`}>
                                        {p.type}
                                    </span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatCurrency(p.amount)}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {new Date(p.date).toLocaleDateString()} {p.note && `• ${p.note}`}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded p-0.5">
                            <button onClick={() => setPaymentType('ADVANCE')} className={`flex-1 text-[10px] font-bold rounded py-1 transition ${paymentType === 'ADVANCE' ? 'bg-white dark:bg-slate-700 shadow text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>Advance</button>
                            <button onClick={() => setPaymentType('SALARY')} className={`flex-1 text-[10px] font-bold rounded py-1 transition ${paymentType === 'SALARY' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>Salary</button>
                        </div>
                        <input
                            type="text"
                            placeholder="Note (Optional)"
                            value={paymentNote}
                            onChange={e => setPaymentNote(e.target.value)}
                            className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded text-xs outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <IndianRupee className="absolute left-2 top-2 text-slate-400 w-3.5 h-3.5" />
                            <input
                                type="number"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                placeholder="Amount"
                                className="w-full pl-7 pr-2 py-1.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={onAddPayment}
                            disabled={!paymentAmount}
                            className="bg-slate-800 dark:bg-slate-700 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
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
