import React from 'react';
import { XCircle } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    documentType: string;
    totalAmount: number;
    paidAmount: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    documentType,
    totalAmount,
    paidAmount
}) => {
    if (!isOpen) return null;

    const remainingAmount = totalAmount - paidAmount;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        onSubmit({
            amount: parseFloat(formData.get('amount') as string),
            paymentMethod: formData.get('paymentMethod'),
            paymentDate: formData.get('paymentDate'),
            notes: formData.get('notes')
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-neutral-800 rounded-sm w-full max-w-md shadow-2xl border dark:border-neutral-700 overflow-hidden flex flex-col">
                <div className="p-6 border-b dark:border-neutral-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight italic">Record Payment</h2>
                        <p className="text-xs text-neutral-500 font-medium">Capture settlement for {documentType}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors">
                        <XCircle className="w-6 h-6 text-neutral-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl mb-4 text-sm font-medium">
                        <div>
                            <p className="text-neutral-400 text-[10px] uppercase font-bold">Total Amount</p>
                            <p className="text-neutral-900 dark:text-white">₹{totalAmount.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-neutral-400 text-[10px] uppercase font-bold">Paid So Far</p>
                            <p className="text-neutral-900 dark:text-white">₹{paidAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 block">Payment Amount (₹)</label>
                            <input
                                name="amount"
                                type="number"
                                defaultValue={remainingAmount}
                                step="any"
                                max={remainingAmount}
                                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 block">Payment Date</label>
                            <input
                                name="paymentDate"
                                type="date"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 block">Method</label>
                            <select
                                name="paymentMethod"
                                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold"
                                required
                            >
                                <option value="Cash">Cash</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="UPI">UPI</option>
                                <option value="Cheque">Cheque</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 block">Notes</label>
                            <textarea
                                name="notes"
                                rows={2}
                                className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm"
                                placeholder="Optional payment notes..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
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
