import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../redux/store';
import { getAllBills } from '../../../redux/slices/billSlice';
import { Bill } from '../../../redux/slices/billSlice';
import { formatDate } from '../../../utils/helpers';
import { Button, Modal } from '../../../components/shared';
import { Input } from '@/components/shared/Input';

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
        .reduce((sum, [___, val]) => sum + val, 0);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Select Bills for Settlement"
            size="xl"
            footer={
                <div className="flex justify-between items-center">
                    <div className="text-sm">
                        <span className="text-slate-500">Selected Due: </span>
                        <strong className="text-slate-800 dark:text-white text-lg ml-1">₹{totalSelectedDue.toLocaleString()}</strong>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right mr-4">
                            <div className="text-sm text-slate-500">Total To Pay</div>
                            <div className="text-xl font-bold text-primary dark:text-primary">₹{totalAllocated.toLocaleString()}</div>
                        </div>

                        <Button variant="secondary" size="md" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="md"
                            icon={<CheckCircle size={18} />}
                            onClick={handleConfirm}
                            disabled={selectedBillIds.size === 0}
                        >
                            Confirm Selection
                        </Button>
                    </div>
                </div>
            }
        >
            <p className="text-sm text-slate-500 -mt-2 mb-4">Select unpaid invoices to settle</p>
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                                        <tr key={billId} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${isSelected ? 'bg-primary/30 dark:bg-primary-soft' : ''}`}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleBill(bill)}
                                                    className="rounded border-slate-300 text-primary focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-800 dark:text-slate-200">{bill.billNo}</div>
                                                <div className="text-xs text-slate-500">{formatDate(bill.date)}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-600">₹{bill.amount?.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">₹{due.toLocaleString()}</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    disabled={!isSelected}
                                                    value={allocations[billId] || ''}
                                                    onChange={(e) => handleAllocationChange(billId, parseFloat(e.target.value))}
                                                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-right focus:border-primary outline-none disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 transition-all font-medium"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    disabled={!isSelected}
                                                    value={discounts[billId] || ''}
                                                    onChange={(e) => handleDiscountChange(billId, parseFloat(e.target.value))}
                                                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-right text-sm focus:border-primary outline-none disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900 transition-all"
                                                    placeholder="0"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
        </Modal>
    );
};

export default BillSelectionModal;
