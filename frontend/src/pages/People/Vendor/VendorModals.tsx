import React from 'react';
import { Plus, IndianRupee, FileText, Trash2, Loader2 } from 'lucide-react';
import { Vendor, VendorTransaction } from "../../../types/vendor";

interface VendorModalsProps {
    isPaymentOpen: boolean;
    setIsPaymentOpen: (val: boolean) => void;
    selectedVendorForModal: Vendor | null;
    paymentData: { amount: number; description: string; date: string };
    setPaymentData: (data: any) => void;
    onRecordPayment: (e: React.FormEvent) => void;

    isHistoryOpen: boolean;
    setIsHistoryOpen: (val: boolean) => void;
    vendorHistory: VendorTransaction[];

    isDeleteModalOpen: boolean;
    setIsDeleteModalOpen: (val: boolean) => void;
    vendorToDelete: Vendor | null;
    isDeleting: boolean;
    confirmDelete: () => void;
}

const VendorModals: React.FC<VendorModalsProps> = ({
    isPaymentOpen, setIsPaymentOpen, selectedVendorForModal, paymentData, setPaymentData, onRecordPayment,
    isHistoryOpen, setIsHistoryOpen, vendorHistory,
    isDeleteModalOpen, setIsDeleteModalOpen, vendorToDelete, isDeleting, confirmDelete
}) => {
    return (
        <>
            {/* Payment Modal */}
            {isPaymentOpen && selectedVendorForModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-6 py-4 bg-emerald-600 text-white flex justify-between items-center">
                            <h3 className="text-xl font-black uppercase tracking-tight">Record Payment</h3>
                            <button onClick={() => setIsPaymentOpen(false)} className="text-white/60 hover:text-white transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>
                        <form onSubmit={onRecordPayment} className="p-6 space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 mb-4">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Paying To</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedVendorForModal.businessName}</p>
                                <p className="text-sm font-bold text-red-600 mt-1">Outstanding: ₹{(selectedVendorForModal.currentBalance ?? 0).toLocaleString()}</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Payment Amount</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="number"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 dark:text-white font-black text-xl"
                                        placeholder="0.00"
                                        value={paymentData.amount || ''}
                                        onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Payment Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 dark:text-white"
                                    value={paymentData.date}
                                    onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Notes / Reference</label>
                                <textarea
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 dark:text-white text-sm"
                                    placeholder="e.g. Paid via UPI / Cheque #12345"
                                    value={paymentData.description}
                                    onChange={e => setPaymentData({ ...paymentData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsPaymentOpen(false)} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
                                    Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {isHistoryOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 bg-indigo-600 text-white flex justify-between items-center shadow-lg">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Financial Ledger</h3>
                                <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Transaction history for selected vendor</p>
                            </div>
                            <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50 dark:bg-slate-900">
                            {vendorHistory.length === 0 ? (
                                <div className="py-20 text-center">
                                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 font-bold">No transactions recorded yet.</p>
                                </div>
                            ) : (
                                <table className="w-full border-separate border-spacing-y-3">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <th className="px-4 text-left">Date</th>
                                            <th className="px-4 text-left">Type</th>
                                            <th className="px-4 text-left">Description</th>
                                            <th className="px-4 text-right">Debit / Credit</th>
                                            <th className="px-4 text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vendorHistory.map(tx => (
                                            <tr key={tx.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm group border border-slate-100 dark:border-slate-700/50">
                                                <td className="px-4 py-4 rounded-l-xl text-xs font-bold text-slate-600 dark:text-slate-400">
                                                    {new Date(tx.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tx.type === 'PURCHASE' ? 'bg-amber-100 text-amber-700' :
                                                        tx.type === 'PAYMENT' ? 'bg-sky-100 text-sky-700' :
                                                            tx.type === 'RETURN' ? 'bg-rose-100 text-rose-700' :
                                                                'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {tx.description}
                                                    {tx.referenceId && <p className="text-[10px] text-slate-400 font-mono mt-0.5">Ref: {tx.referenceId}</p>}
                                                </td>
                                                <td className={`px-4 py-4 text-right font-black ${tx.amount > 0 ? 'text-orange-600' : 'text-sky-600'}`}>
                                                    {tx.amount > 0 ? `+ ₹${tx.amount.toLocaleString()}` : `- ₹${Math.abs(tx.amount).toLocaleString()}`}
                                                </td>
                                                <td className="px-4 py-4 rounded-r-xl text-right font-black text-slate-900 dark:text-white">
                                                    ₹{tx.balanceAfter.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && vendorToDelete && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 w-full max-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Delete Supplier?</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                You are about to remove <span className="font-black text-rose-600">{vendorToDelete.businessName}</span>. This action is critical and cannot be easily undone.
                            </p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-4">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VendorModals;
