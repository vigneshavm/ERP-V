
import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { PurchaseOrder } from "../../../types/purchase";
import { useDispatch } from 'react-redux';
// We assume we can import these. If not, we might need to verify paths.
// Based on Bills.tsx imports:
import { createBill } from "../../../redux/slices/billSlice";
import { AppDispatch } from "../../../redux/store";
import { toast } from 'react-toastify';

interface CreateBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: PurchaseOrder;
    onBillCreated: () => void;
}

const CreateBillModal: React.FC<CreateBillModalProps> = ({ isOpen, onClose, order, onBillCreated }) => {
    const dispatch = useDispatch<AppDispatch>();
    const [loading, setLoading] = useState(false);

    // Initial State pre-filled from Order
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        supplier: order.vendor_id || '', // Provided order has vendor_id
        amount: order.total_amount,
        dueDate: '',
        status: 'unpaid',
        description: `Bill for PO #${order.po_number}`,
        paymentMethod: 'cash',
        paidAmount: 0,
        bankAccount: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await dispatch(createBill(formData)).unwrap(); // Assuming unwrap is available if using createAsyncThunk
            toast.success('Bill created successfully');
            onBillCreated();
            onClose();
        } catch (error: any) {
            console.error("Failed to create bill:", error);
            toast.error(error.message || 'Failed to create bill');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-sm w-full max-w-lg shadow-2xl border dark:border-neutral-700 flex flex-col">
                <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold mb-1">Create Bill</h2>
                        <p className="text-sm text-neutral-500">For PO #{order.po_number}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Bill Date</label>
                            <input
                                type="date"
                                required
                                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Due Date</label>
                            <input
                                type="date"
                                className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-2 text-neutral-500">₹</span>
                            <input
                                type="number"
                                required
                                disabled // Usually bill matches PO, but maybe editable? Let's keep editable but prefilled
                                className="w-full pl-8 pr-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
                        <textarea
                            className="w-full px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-600/25 hover:bg-purple-700 transition-all flex items-center gap-2"
                        >
                            {loading ? 'Creating...' : <><FileText className="w-4 h-4" /> Create Bill</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBillModal;
