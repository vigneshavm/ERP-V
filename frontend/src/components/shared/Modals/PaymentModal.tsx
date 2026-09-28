import React, { useEffect, useState } from 'react';
import { XCircle } from 'lucide-react';
import api from '../../../services/api';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    documentType: string;
    totalAmount: number;
    paidAmount: number;
}

interface BankAccountOption {
    _id: string;
    bankName?: string;
    accountNumber?: string;
    currentBalance?: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    documentType,
    totalAmount,
    paidAmount
}) => {
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);

    // Bank accounts are only needed once the user picks Bank Transfer; fetched lazily so this
    // shared modal doesn't hit the API for every payment regardless of method.
    useEffect(() => {
        if (!isOpen || paymentMethod !== 'bank_transfer' || bankAccounts.length) return;
        api.get('/api/cashbank/accounts')
            .then(({ data }) => setBankAccounts((Array.isArray(data) ? data : data?.data ?? []).filter((acc: any) => acc.status === 'active')))
            .catch(() => setBankAccounts([]));
    }, [isOpen, paymentMethod, bankAccounts.length]);

    if (!isOpen) return null;

    const remainingAmount = totalAmount - paidAmount;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const amount = parseFloat(formData.get('amount') as string);
        onSubmit({
            amount,
            // Consumers disagree on the field name for the same value (SalesService.markAsPaid
            // expects `amount`, BillController.updateBillPayment expects `paidAmount`) -- send both.
            paidAmount: amount,
            paymentMethod,
            bankAccount: paymentMethod === 'bank_transfer' ? (formData.get('bankAccount') as string) : undefined,
            paymentDate: formData.get('paymentDate'),
            notes: formData.get('notes')
        });
    };

    return (
        <div className="ui-modal-backdrop bg-black/60 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-sm w-full max-w-md shadow-2xl border dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="p-6 border-b dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight italic">Record Payment</h2>
                        <p className="text-xs text-slate-500 font-medium">Capture settlement for {documentType}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                        <XCircle className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl mb-4 text-sm font-medium">
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold">Total Amount</p>
                            <p className="text-slate-900 dark:text-white">₹{totalAmount.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase font-bold">Paid So Far</p>
                            <p className="text-slate-900 dark:text-white">₹{paidAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="label-sm text-slate-400 mb-1 block">Payment Amount (₹)</label>
                            <input
                                name="amount"
                                type="number"
                                defaultValue={remainingAmount}
                                step="any"
                                max={remainingAmount}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                required
                            />
                        </div>

                        <div>
                            <label className="label-sm text-slate-400 mb-1 block">Payment Date</label>
                            <input
                                name="paymentDate"
                                type="date"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                required
                            />
                        </div>

                        <div>
                            <label className="label-sm text-slate-400 mb-1 block">Method</label>
                            <select
                                name="paymentMethod"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                required
                            >
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="upi">UPI</option>
                                <option value="cheque">Cheque</option>
                            </select>
                        </div>

                        {paymentMethod === 'bank_transfer' && (
                            <div>
                                <label className="label-sm text-slate-400 mb-1 block">Bank Account</label>
                                <select
                                    name="bankAccount"
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                                    required
                                >
                                    <option value="">Choose Bank Account</option>
                                    {bankAccounts.map((acc) => (
                                        <option key={acc._id} value={acc._id}>
                                            {acc.bankName} - ****{acc.accountNumber?.slice(-4)} (₹{acc.currentBalance?.toLocaleString()})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="label-sm text-slate-400 mb-1 block">Notes</label>
                            <textarea
                                name="notes"
                                rows={2}
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                placeholder="Optional payment notes..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                        >
                            Record Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;
