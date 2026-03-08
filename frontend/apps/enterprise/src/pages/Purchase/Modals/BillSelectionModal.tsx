import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Search, Filter } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../redux/store';
import { getAllBills } from '../../../redux/slices/billSlice';
import { Bill } from '../../../redux/slices/billSlice';

interface BillSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplierId: string;
    onConfirm: (selectedBills: Bill[], allocations: { [billId: string]: number }, discounts: { [billId: string]: number }) => void;
    initialAllocations?: { [billId: string]: number };
    initialDiscounts?: { [billId: string]: number };
}

const BillSelectionModal: React.FC<BillSelectionModalProps> = ({
    isOpen,
    onClose,
    supplierId,
    onConfirm,
    initialAllocations = {},
    initialDiscounts = {}
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const [loading, setLoading] = useState(false);
    const [bills, setBills] = useState<Bill[]>([]);

    // Selection state
    const [selectedBillIds, setSelectedBillIds] = useState<Set<string>>(new Set(Object.keys(initialAllocations)));
    const [allocations, setAllocations] = useState<{ [billId: string]: number }>(initialAllocations);
    const [discounts, setDiscounts] = useState<{ [billId: string]: number }>(initialDiscounts);

    useEffect(() => {
        if (isOpen && supplierId) {
            fetchBills();
        }
    }, [isOpen, supplierId]);

    const fetchBills = async () => {
        setLoading(true);
        try {
            // Fetch unpaid and partial bills
            const result = await dispatch(getAllBills({
                supplier: supplierId,
                paymentStatus: 'unpaid,partial'
            })).unwrap();

            // Also fetch paid bills if they have allocations (in case of editing), but usually settlement is for unpaid.
            // For now, just show unpaid/partial.
            setBills(result);
        } catch (error) {
            console.error("Failed to fetch bills", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBill = (bill: Bill) => {
        const newSelected = new Set(selectedBillIds);
        const billId = bill._id || '';

        if (newSelected.has(billId)) {
            newSelected.delete(billId);
            // Optional: clear allocation? Better to keep it if they re-select.
        } else {
            newSelected.add(billId);
            // Default allocation to full due amount if not set
            if (!allocations[billId]) {
                const due = (bill.amount || 0) - (bill.paidAmount || 0) - (bill.discountReceived || 0);
                setAllocations(prev => ({ ...prev, [billId]: due }));
            }
        }
        setSelectedBillIds(newSelected);
    };

    const handleAllocationChange = (billId: string, value: number) => {
        setAllocations(prev => ({ ...prev, [billId]: value }));
    };

    const handleDiscountChange = (billId: string, value: number) => {
        setDiscounts(prev => ({ ...prev, [billId]: value }));
    };

    const handleConfirm = () => {
        const selectedBills = bills.filter(b => selectedBillIds.has(b._id || ''));
        // Filter allocations/discounts to only selected bills
        const finalAllocations: { [id: string]: number } = {};
        const finalDiscounts: { [id: string]: number } = {};

        selectedBills.forEach(b => {
            const bid = b._id || '';
            finalAllocations[bid] = allocations[bid] || 0;
            finalDiscounts[bid] = discounts[bid] || 0;
        });

        onConfirm(selectedBills, finalAllocations, finalDiscounts);
        onClose();
    };

    if (!isOpen) return null;

    const totalSelectedDue = bills
        .filter(b => selectedBillIds.has(b._id || ''))
        .reduce((sum, b) => sum + ((b.amount || 0) - (b.paidAmount || 0) - (b.discountReceived || 0)), 0);

    const totalAllocated = Object.entries(allocations)
        .filter(([id]) => selectedBillIds.has(id))
        .reduce((sum, [_, val]) => sum + val, 0);

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl border dark:border-slate-700 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold mb-1 text-slate-800 dark:text-white">Select Bills for Settlement</h2>
                        <p className="text-sm text-slate-500">Select unpaid invoices to settle</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : bills.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <CheckCircle size={48} className="mx-auto mb-3 opacity-20" />
                            <p>No unpaid bills found for this supplier.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm border-separate border-spacing-0">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg border-b border-slate-200 dark:border-slate-700 w-12">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300"
                                            checked={bills.length > 0 && selectedBillIds.size === bills.length}
                                            onChange={() => {
                                                if (selectedBillIds.size === bills.length) {
                                                    setSelectedBillIds(new Set());
                                                } else {
                                                    const allIds = new Set(bills.map(b => b._id || ''));
                                                    setSelectedBillIds(allIds);
                                                    // Auto allocate all
                                                    const newAlloc: any = {};
                                                    bills.forEach(b => {
                                                        const due = (b.amount || 0) - (b.paidAmount || 0) - (b.discountReceived || 0);
                                                        newAlloc[b._id || ''] = due;
                                                    });
                                                    setAllocations(newAlloc);
                                                }
                                            }}
                                        />
                                    </th>
                                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">Bill Details</th>
                                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-right">Bill Amount</th>
                                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-right">Balance Due</th>
                                    <th className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 w-40">Payment Amt</th>
                                    <th className="px-4 py-3 rounded-r-lg border-b border-slate-200 dark:border-slate-700 w-32">Discount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {bills.map(bill => {
                                    const billId = bill._id || '';
                                    const isSelected = selectedBillIds.has(billId);
                                    const due = (bill.amount || 0) - (bill.paidAmount || 0) - (bill.discountReceived || 0);

                                    return (
                                        <tr key={billId} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleBill(bill)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-800 dark:text-slate-200">{bill.billNo}</div>
                                                <div className="text-xs text-slate-500">{new Date(bill.date).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600">₹{bill.amount?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">₹{due.toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    disabled={!isSelected}
                                                    value={allocations[billId] || ''}
                                                    onChange={(e) => handleAllocationChange(billId, parseFloat(e.target.value))}
                                                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-right focus:border-indigo-500 outline-none disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 transition-all font-medium"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    disabled={!isSelected}
                                                    value={discounts[billId] || ''}
                                                    onChange={(e) => handleDiscountChange(billId, parseFloat(e.target.value))}
                                                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-right text-sm focus:border-indigo-500 outline-none disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 transition-all"
                                                    placeholder="0"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-between items-center">
                    <div className="text-sm">
                        <span className="text-slate-500">Selected Due: </span>
                        <strong className="text-slate-800 dark:text-white text-lg ml-1">₹{totalSelectedDue.toLocaleString()}</strong>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right mr-4">
                            <div className="text-sm text-slate-500">Total To Pay</div>
                            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">₹{totalAllocated.toLocaleString()}</div>
                        </div>

                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedBillIds.size === 0}
                            className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <CheckCircle size={18} />
                            Confim Selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillSelectionModal;
